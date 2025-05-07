'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import DropboxIcon from '@/components/icons/DropboxIcon'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

// Define interfaces for the cloud providers
interface DropboxOptions {
  success: (files: DropboxFile[]) => void
  cancel?: () => void
  linkType: string
  multiselect: boolean
  extensions: string[]
  folderselect: boolean
  sizeLimit?: number
}

interface DropboxFile {
  name: string
  link: string
  bytes: number
  icon: string
  thumbnailLink?: string
  isDir: boolean
}

interface CloudProviderButtonsProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

// Declare global types for the cloud provider SDKs
declare global {
  interface Window {
    Dropbox?: {
      choose: (options: DropboxOptions) => void
    }
  }
}

// Interface for the response from the API
interface CloudIntegrationsResponse {
  dropboxAppKey?: string
  googleApiKey?: string
  googleClientId?: string
  error?: string
}

// Maximum file size for uploads (5 GB)
const MAX_FILE_SIZE_BYTES = 5368709120 // 5 GB

const CloudProviderButtons: React.FC<CloudProviderButtonsProps> = ({
  onFileSelected,
  disabled,
}) => {
  const [dropboxAppKey, setDropboxAppKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  // Fetch cloud integration settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        clientLogger.info('Fetching cloud integration settings', 'CloudProviderButtons')

        // Fetch from the general cloud-integrations endpoint
        const response = await fetch('/api/cloud-integrations', {
          // Add cache control headers to ensure we get fresh data
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch cloud integration settings: ${response.statusText}`)
        }

        const data = (await response.json()) as CloudIntegrationsResponse

        clientLogger.info(
          'Cloud integration settings fetched successfully',
          'CloudProviderButtons',
          {
            hasDropboxAppKey: !!data.dropboxAppKey,
            hasGoogleApiKey: !!data.googleApiKey,
            hasGoogleClientId: !!data.googleClientId,
          },
        )

        if (data.dropboxAppKey) {
          setDropboxAppKey(data.dropboxAppKey)
          clientLogger.info('Dropbox key is configured and available', 'CloudProviderButtons')
        } else {
          // If no key is available, set error state
          setDropboxAppKey(null)
          setError(
            'Dropbox integration is not configured. Please add a Dropbox App Key in the Cloud Integration settings.',
          )
          clientLogger.warn(
            'No Dropbox key found in cloud-integrations global',
            'CloudProviderButtons',
          )
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        clientLogger.error('Error fetching cloud integration settings', 'CloudProviderButtons', {
          error: errorMsg,
        })

        // Set error state without using any fallback
        setDropboxAppKey(null)
        setError(`Error connecting to cloud integration settings: ${errorMsg}`)
      }
    }

    fetchSettings()
  }, [])

  // Determine if the button should be disabled
  const dropboxDisabled = disabled || !dropboxAppKey || uploading

  // Show error message if there was an error fetching settings
  const errorMessage = error ? (
    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
      <p className="font-medium">Dropbox Integration Not Configured</p>
      <p>{error}</p>
      <p className="mt-1">
        Please go to the Admin Dashboard &gt; Settings &gt; Cloud Integrations and add your Dropbox
        App Key.
      </p>
      <p className="mt-1">
        <strong>Note:</strong> You need to create the cloud-integrations global in Payload CMS.
      </p>
    </div>
  ) : null

  return (
    <div className="space-y-4">
      {/* Show error message if there was an error */}
      {errorMessage}

      {/* Cloud Provider Buttons */}
      <div className="flex flex-wrap gap-4">
        {/* Dropbox button */}
        <Button
          onClick={async () => {
            if (!dropboxAppKey || uploading) return

            setUploading(true)

            try {
              clientLogger.info('Dropbox button clicked', 'CloudProviderButtons')

              // Create a script element for Dropbox
              const script = document.createElement('script')
              script.id = 'dropboxjs'
              script.type = 'text/javascript'
              script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
              script.setAttribute('data-app-key', dropboxAppKey)

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
                      clientLogger.info('Files selected from Dropbox', 'CloudProviderButtons', {
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
                  clientLogger.info('Creating Mux asset from Dropbox URL', 'CloudProviderButtons', {
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
                      clientLogger.error('Error parsing error response', 'CloudProviderButtons', {
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
                    clientLogger.error('Error parsing success response', 'CloudProviderButtons', {
                      error: 'Failed to parse JSON response',
                    })
                    throw new Error('Failed to parse response from server')
                  }

                  clientLogger.info('Mux asset created successfully', 'CloudProviderButtons', {
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

                  clientLogger.error('Error processing file from Dropbox', 'CloudProviderButtons', {
                    error: errMsg,
                    fileName: file.name,
                  })
                }
              }
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown error'

              // Don't show error for cancelled selection
              if (errorMsg !== 'Dropbox selection cancelled') {
                clientLogger.error('Error in Dropbox upload process', 'CloudProviderButtons', {
                  error: errorMsg,
                  stack: error instanceof Error ? error.stack : 'No stack trace',
                })

                toast({
                  title: 'Error',
                  description: errorMsg,
                  variant: 'destructive',
                })
              } else {
                clientLogger.info('Dropbox selection cancelled', 'CloudProviderButtons')
              }
            } finally {
              setUploading(false)
            }
          }}
          id="dropbox-button"
          disabled={dropboxDisabled}
          variant="outline"
          title={
            !dropboxAppKey
              ? 'Dropbox integration is not configured'
              : 'Choose video files from Dropbox'
          }
        >
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <DropboxIcon className={uploading ? 'hidden' : 'mr-2 h-4 w-4'} />
          Choose from Dropbox
        </Button>
      </div>
    </div>
  )
}

export default CloudProviderButtons
