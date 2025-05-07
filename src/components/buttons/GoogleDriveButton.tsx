'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import { useToast } from '@/hooks/use-toast'
import { Loader2, FileBox } from 'lucide-react'
import Script from 'next/script'

// Define interfaces for Google Drive
export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  downloadUrl?: string
}

// Declare global types for the Google Drive SDK
declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
      client: {
        init: (options: any) => Promise<void>
        load: (api: string, version: string, callback: () => void) => void
        picker: {
          create: (options: any) => any
        }
      }
      auth: {
        getToken: () => { access_token: string }
      }
    }
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any
        }
      }
      picker: {
        View: any
        ViewId: any
        Feature: any
        Action: any
        PickerBuilder: new () => any
      }
    }
  }
}

interface GoogleDriveButtonProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
  clientId: string
}

export const GoogleDriveButton: React.FC<GoogleDriveButtonProps> = ({
  onFileSelected,
  disabled = false,
  clientId,
}) => {
  const [uploading, setUploading] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const { toast } = useToast()

  // Determine if the button should be disabled
  const buttonDisabled = disabled || !clientId || uploading || !sdkLoaded

  // Load Google API SDK
  useEffect(() => {
    if (!clientId) {
      console.log('No clientId provided, skipping Google API SDK loading')
      return
    }

    console.log('Loading Google API SDK with clientId:', clientId)

    // Function to load the Google Picker API
    const loadGooglePickerAPI = () => {
      // Load the Google Picker API
      if (window.gapi) {
        console.log('Loading Google Picker API')
        window.gapi.load('picker', {
          callback: () => {
            console.log('Google Picker API loaded successfully')
            setSdkLoaded(true)
          },
          onerror: () => {
            console.error('Failed to load Google Picker API')
          },
        })
      } else {
        console.error('Google API not available')
      }
    }

    // Check if script already exists
    const existingScript = document.getElementById('google-api-sdk')
    if (existingScript) {
      console.log('Google API SDK script already exists')
      // If script exists, check if Google API is loaded
      if (window.gapi) {
        console.log('window.gapi is available, loading Picker API')
        loadGooglePickerAPI()
      } else {
        console.log('window.gapi is not available yet')
      }
      return
    }

    // Create a new script element
    console.log('Creating Google API SDK script element')
    const script = document.createElement('script')
    script.id = 'google-api-sdk'
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      console.log('Google API SDK script loaded successfully')
      loadGooglePickerAPI()
    }
    script.onerror = (error) => {
      console.error('Failed to load Google API SDK', error)
      clientLogger.error('Failed to load Google API SDK', 'GoogleDriveButton')
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [clientId])

  const handleGoogleDriveClick = async () => {
    if (!clientId || uploading || !sdkLoaded) return

    setUploading(true)

    try {
      clientLogger.info('Google Drive button clicked', 'GoogleDriveButton')

      // Make sure the picker API is loaded
      if (!window.google?.picker) {
        throw new Error('Google Picker API not loaded')
      }

      const picker = window.google.picker
      const view = new picker.View(picker.ViewId.DOCS_VIDEOS)
      view.setMimeTypes('video/mp4,video/quicktime,video/webm,video/x-matroska')

      // Create the picker
      console.log('Creating Google Picker instance')
      const pickerInstance = new picker.PickerBuilder()
        .addView(view)
        .enableFeature(picker.Feature.NAV_HIDDEN)
        .enableFeature(picker.Feature.MULTISELECT_ENABLED)
        .setCallback((data: any) => {
          if (data.action === picker.Action.PICKED) {
            const file = data.docs[0]
            clientLogger.info('File selected from Google Drive', 'GoogleDriveButton', {
              fileName: file.name,
            })

            // Show toast for upload start
            toast({
              title: 'Uploading to Mux...',
              description: file.name,
            })

            // For public files, we can use the downloadUrl directly
            if (file.downloadUrl) {
              downloadFileFromUrl(file.downloadUrl, file.name, false)
                .then((fileObj) => {
                  // Call our API endpoint to create a Mux asset from the URL
                  return createMuxAssetFromFile(fileObj, file.name)
                })
                .then((result) => {
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
                })
                .catch((error) => {
                  const errMsg = error instanceof Error ? error.message : 'Unknown error'

                  // Show error toast
                  toast({
                    title: 'Upload failed',
                    description: `${file.name}: ${errMsg}`,
                    variant: 'destructive',
                  })

                  clientLogger.error(
                    'Error processing file from Google Drive',
                    'GoogleDriveButton',
                    {
                      error: errMsg,
                      fileName: file.name,
                    },
                  )
                })
                .finally(() => {
                  setUploading(false)
                })
            } else {
              // For private files, we would need OAuth, but for now just show an error
              clientLogger.error('File does not have a direct download URL', 'GoogleDriveButton')
              toast({
                title: 'Upload failed',
                description:
                  'This file cannot be downloaded directly. Please make sure the file is public or use another upload method.',
                variant: 'destructive',
              })
              setUploading(false)
            }
          } else if (data.action === picker.Action.CANCEL) {
            clientLogger.info('Google Drive selection cancelled', 'GoogleDriveButton')
            setUploading(false)
          }
        })
        .build()

      pickerInstance.setVisible(true)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      clientLogger.error('Error in Google Drive upload process', 'GoogleDriveButton', {
        error: errorMsg,
        stack: error instanceof Error ? error.stack : 'No stack trace',
      })

      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })

      setUploading(false)
    }
  }

  // Helper function to download a file from a URL
  const downloadFileFromUrl = async (
    url: string,
    fileName: string,
    requiresAuth: boolean = false,
  ): Promise<File> => {
    try {
      clientLogger.info('Downloading file from URL', 'GoogleDriveButton', { url, fileName })

      const fetchOptions: RequestInit = {
        method: 'GET',
      }

      // Add authorization header if required
      if (requiresAuth && window.gapi?.auth.getToken()?.access_token) {
        fetchOptions.headers = {
          Authorization: `Bearer ${window.gapi.auth.getToken().access_token}`,
        }
      }

      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()

      // Determine MIME type based on file extension
      let mimeType = 'video/mp4' // Default
      if (fileName.endsWith('.mov')) mimeType = 'video/quicktime'
      else if (fileName.endsWith('.webm')) mimeType = 'video/webm'
      else if (fileName.endsWith('.avi')) mimeType = 'video/x-msvideo'
      else if (fileName.endsWith('.mkv')) mimeType = 'video/x-matroska'

      // Create a File object from the blob
      return new File([blob], fileName, { type: mimeType })
    } catch (error) {
      clientLogger.error('Error downloading file', 'GoogleDriveButton', { error })
      throw error
    }
  }

  // Helper function to create a Mux asset from a file
  const createMuxAssetFromFile = async (file: File, fileName: string) => {
    try {
      clientLogger.info('Creating Mux asset from file', 'GoogleDriveButton', {
        fileName: fileName,
      })

      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('filename', fileName)

      // Call our API endpoint to create a Mux asset
      const response = await fetch('/api/mux/create', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = response.statusText
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || response.statusText
        } catch (_parseError) {
          clientLogger.error('Error parsing error response', 'GoogleDriveButton', {
            status: response.status,
            statusText: response.statusText,
          })
        }
        throw new Error(`Failed to create Mux asset: ${errorMessage}`)
      }

      return await response.json()
    } catch (error) {
      clientLogger.error('Error creating Mux asset', 'GoogleDriveButton', { error })
      throw error
    }
  }

  return (
    <Button
      onClick={handleGoogleDriveClick}
      id="google-drive-button"
      disabled={buttonDisabled}
      variant="outline"
      title={
        !clientId
          ? 'Google Drive integration is not configured'
          : !sdkLoaded
            ? 'Google Drive SDK is loading...'
            : 'Choose video files from Google Drive'
      }
    >
      {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <FileBox className={uploading ? 'hidden' : 'mr-2 h-4 w-4'} />
      Choose from Google Drive
    </Button>
  )
}
