'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import DropboxIcon from '@/components/icons/DropboxIcon'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

// Define interfaces for Dropbox
export interface DropboxOptions {
  success: (files: DropboxFile[]) => void
  cancel?: () => void
  linkType: string
  multiselect: boolean
  extensions: string[]
  folderselect: boolean
  sizeLimit?: number
}

export interface DropboxFile {
  name: string
  link: string
  bytes: number
  icon: string
  thumbnailLink?: string
  isDir: boolean
}

// Declare global types for the Dropbox SDK
declare global {
  interface Window {
    Dropbox?: {
      choose: (options: DropboxOptions) => void
    }
  }
}

// Maximum file size for uploads (5 GB)
const MAX_FILE_SIZE_BYTES = 5368709120 // 5 GB

interface DropboxButtonProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
  appKey: string
}

export const DropboxButton: React.FC<DropboxButtonProps> = ({
  onFileSelected,
  disabled = false,
  appKey,
}) => {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  // Determine if the button should be disabled
  const buttonDisabled = disabled || !appKey || uploading

  const handleDropboxClick = async () => {
    if (!appKey || uploading) return

    setUploading(true)

    try {
      clientLogger.info('Dropbox button clicked', 'DropboxButton')

      // Create a script element for Dropbox
      const script = document.createElement('script')
      script.id = 'dropboxjs'
      script.type = 'text/javascript'
      script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
      script.setAttribute('data-app-key', appKey)

      // Wait for the script to load
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Dropbox SDK'))
        document.body.appendChild(script)
      })

      // Make sure Dropbox is available
      if (!window.Dropbox) {
        throw new Error('Dropbox SDK not available after loading')
      }

      // Choose files from Dropbox
      const files = await new Promise<DropboxFile[]>((resolve, reject) => {
        window.Dropbox?.choose({
          success: (files) => {
            if (files && files.length > 0) {
              clientLogger.info('Files selected from Dropbox', 'DropboxButton', {
                fileCount: files.length,
              })
              resolve(files)
            } else {
              reject(new Error('No files selected from Dropbox'))
            }
          },
          cancel: () => {
            reject(new Error('Dropbox selection cancelled'))
          },
          linkType: 'preview',
          multiselect: true,
          extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
          folderselect: true,
          sizeLimit: MAX_FILE_SIZE_BYTES,
        })
      })

      // Process each file
      for (const file of files) {
        // Show toast for upload start
        toast({
          title: 'Uploading to Mux...',
          description: file.name,
        })

        try {
          clientLogger.info('Creating Mux asset from Dropbox URL', 'DropboxButton', {
            fileName: file.name,
            fileLink: file.link.substring(0, 50) + '...', // Truncate for logging
          })

          // Call our API endpoint to create a Mux asset from the URL
          const response = await fetch('/api/mux/create-from-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: file.link,
              filename: file.name,
            }),
          })

          if (!response.ok) {
            let errorMessage = response.statusText
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || response.statusText
            } catch (_parseError) {
              // If we can't parse the response as JSON, use the status text
              clientLogger.error('Error parsing error response', 'DropboxButton', {
                status: response.status,
                statusText: response.statusText,
              })
            }
            throw new Error(`Failed to create Mux asset: ${errorMessage}`)
          }

          let result
          try {
            result = await response.json()
          } catch (_parseError) {
            clientLogger.error('Error parsing success response', 'DropboxButton', {
              error: 'Failed to parse JSON response',
            })
            throw new Error('Failed to parse response from server')
          }

          clientLogger.info('Mux asset created successfully', 'DropboxButton', {
            assetId: result.data.asset.id,
            playbackId: result.data.asset.playbackId,
            status: result.data.asset.status,
          })

          // Create a File object to maintain compatibility with the existing code
          const fileObj = new File(
            [new Blob([''], { type: 'application/octet-stream' })],
            file.name,
            { type: 'video/mp4' },
          )

          // Add custom properties to the file object
          Object.defineProperties(fileObj, {
            muxAssetId: { value: result.data.asset.id, writable: true },
            muxPlaybackId: { value: result.data.asset.playbackId, writable: true },
            muxStatus: { value: result.data.asset.status, writable: true },
            fromUrl: { value: true, writable: true },
          })

          // Pass the file to the parent component
          onFileSelected(fileObj)

          // Show success toast
          toast({
            title: 'Upload successful',
            description: file.name,
          })
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error'

          // Show error toast
          toast({
            title: 'Upload failed',
            description: `${file.name}: ${errMsg}`,
            variant: 'destructive',
          })

          clientLogger.error('Error processing file from Dropbox', 'DropboxButton', {
            error: errMsg,
            fileName: file.name,
          })
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'

      // Don't show error for cancelled selection
      if (errorMsg !== 'Dropbox selection cancelled') {
        clientLogger.error('Error in Dropbox upload process', 'DropboxButton', {
          error: errorMsg,
          stack: error instanceof Error ? error.stack : 'No stack trace',
        })

        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })
      } else {
        clientLogger.info('Dropbox selection cancelled', 'DropboxButton')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <Button
      onClick={handleDropboxClick}
      id="dropbox-button"
      disabled={buttonDisabled}
      variant="outline"
      title={
        !appKey
          ? 'Dropbox integration is not configured'
          : 'Choose video files from Dropbox'
      }
    >
      {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <DropboxIcon className={uploading ? 'hidden' : 'mr-2 h-4 w-4'} />
      Choose from Dropbox
    </Button>
  )
}
