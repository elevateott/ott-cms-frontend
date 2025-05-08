'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import { useToast } from '@/hooks/use-toast'
import { Loader2, FileBox } from 'lucide-react'

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
        init: (options: Record<string, unknown>) => Promise<void>
        load: (api: string, version: string, callback: () => void) => void
      }
    }
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: Record<string, unknown>) => {
            requestAccessToken: (options?: { prompt?: string }) => void
          }
        }
      }
      picker?: {
        View: new (viewId: string) => {
          setMimeTypes: (mimeTypes: string) => void
        }
        ViewId: Record<string, string>
        Feature: Record<string, string>
        Action: Record<string, string>
        PickerBuilder: new () => {
          enableFeature: (feature: string) => any
          setAppId: (appId: string) => any
          setOAuthToken: (token: string) => any
          setDeveloperKey: (key: string) => any
          addView: (view: any) => any
          setCallback: (callback: (data: Record<string, any>) => void) => any
          build: () => any
          setVisible: (visible: boolean) => void
        }
      }
    }
  }
}

interface GoogleDriveButtonProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
  clientId: string
  apiKey?: string
}

export const GoogleDriveButton: React.FC<GoogleDriveButtonProps> = ({
  onFileSelected,
  disabled = false,
  clientId,
  apiKey = '',
}) => {
  const [uploading, setUploading] = useState(false)
  const [gapiLoaded, setGapiLoaded] = useState(false)
  const [gisLoaded, setGisLoaded] = useState(false)
  const { toast } = useToast()

  // Determine if the button should be disabled
  const isDisabled = disabled || !clientId || !apiKey || uploading || !gapiLoaded || !gisLoaded

  // Load Google API SDK
  useEffect(() => {
    if (!clientId || !apiKey) {
      console.log('No clientId or apiKey provided, skipping Google API SDK loading')
      return
    }

    // Load the Google API script
    const loadGoogleAPI = () => {
      // Check if script already exists
      const existingApiScript = document.getElementById('google-api-sdk')
      if (!existingApiScript) {
        const script = document.createElement('script')
        script.id = 'google-api-sdk'
        script.src = 'https://apis.google.com/js/api.js'
        script.onload = () => {
          console.log('Google API SDK loaded successfully')
          if (window.gapi) {
            window.gapi.load('picker', () => {
              console.log('Google Picker API loaded successfully')
              setGapiLoaded(true)
            })
          }
        }
        script.onerror = (error) => {
          console.error('Failed to load Google API SDK', error)
          clientLogger.error('Failed to load Google API SDK', 'GoogleDriveButton')
        }
        document.body.appendChild(script)
      } else if (window.gapi) {
        window.gapi.load('picker', () => {
          console.log('Google Picker API loaded successfully')
          setGapiLoaded(true)
        })
      }
    }

    // Load the Google Identity Services script
    const loadGoogleIdentityServices = () => {
      // Check if script already exists
      const existingGisScript = document.getElementById('google-identity-services')
      if (!existingGisScript) {
        const script = document.createElement('script')
        script.id = 'google-identity-services'
        script.src = 'https://accounts.google.com/gsi/client'
        script.onload = () => {
          console.log('Google Identity Services loaded successfully')
          setGisLoaded(true)
        }
        script.onerror = (error) => {
          console.error('Failed to load Google Identity Services', error)
          clientLogger.error('Failed to load Google Identity Services', 'GoogleDriveButton')
        }
        document.body.appendChild(script)
      } else {
        setGisLoaded(true)
      }
    }

    // Load both scripts
    loadGoogleAPI()
    loadGoogleIdentityServices()

    return () => {
      // Cleanup if needed
    }
  }, [clientId, apiKey])

  const handleGoogleDriveClick = async () => {
    if (isDisabled) return

    setUploading(true)

    try {
      clientLogger.info('Google Drive button clicked', 'GoogleDriveButton')

      // Make sure the picker API is loaded
      if (!window.google?.picker) {
        throw new Error('Google Picker API not loaded')
      }

      // Get the project number from the Google Cloud Console
      const APP_ID = '226170616436' // Replace with your actual project number

      // Initialize the OAuth token client
      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services not loaded')
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            clientLogger.error('OAuth error', 'GoogleDriveButton', { error: tokenResponse.error })
            toast({
              title: 'Authentication failed',
              description: 'Failed to authenticate with Google Drive',
              variant: 'destructive',
            })
            setUploading(false)
            return
          }

          try {
            const oauthToken = tokenResponse.access_token

            if (!window.google?.picker) {
              throw new Error('Google Picker API not loaded')
            }

            const picker = window.google.picker
            const view = new picker.View(picker.ViewId.DOCS_VIDEOS)
            view.setMimeTypes('video/mp4,video/webm')

            // Create the picker
            const pickerInstance = new picker.PickerBuilder()
              .enableFeature(picker.Feature.MULTISELECT_ENABLED)
              .setAppId(APP_ID)
              .setOAuthToken(oauthToken)
              .setDeveloperKey(apiKey)
              .addView(view)
              .setCallback((data: any) => {
                if (data.action === picker.Action.PICKED && data.docs && data.docs.length > 0) {
                  clientLogger.info('Files selected from Google Drive', 'GoogleDriveButton', {
                    fileCount: data.docs.length,
                  })

                  // Process each selected file
                  processSelectedFiles(data.docs, oauthToken)
                } else if (data.action === picker.Action.CANCEL) {
                  clientLogger.info('Google Drive selection cancelled', 'GoogleDriveButton')
                  setUploading(false)
                }
              })
              .build()

            pickerInstance.setVisible(true)
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            clientLogger.error('Error in Google Drive picker', 'GoogleDriveButton', {
              error: errorMsg,
            })
            toast({
              title: 'Error',
              description: errorMsg,
              variant: 'destructive',
            })
            setUploading(false)
          }
        },
      })

      // Request the OAuth token
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      clientLogger.error('Error in Google Drive upload process', 'GoogleDriveButton', {
        error: errorMsg,
      })
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      })
      setUploading(false)
    }
  }

  // Process selected files from Google Drive
  const processSelectedFiles = async (files: any[], oauthToken: string) => {
    for (const file of files) {
      try {
        // Show toast for upload start
        toast({
          title: 'Uploading to Mux...',
          description: file.name,
        })

        // Get the download URL
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`

        // Download the file
        const response = await fetch(downloadUrl, {
          headers: {
            Authorization: `Bearer ${oauthToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
        }

        const blob = await response.blob()
        const mimeType = file.mimeType || 'video/mp4'
        const fileObj = new File([blob], file.name, { type: mimeType })

        // Upload to Mux
        const formData = new FormData()
        formData.append('file', fileObj)
        formData.append('filename', file.name)

        const muxRes = await fetch('/api/mux/create', {
          method: 'POST',
          body: formData,
        })

        if (!muxRes.ok) {
          let errorMessage = muxRes.statusText
          try {
            const errorData = await muxRes.json()
            errorMessage = errorData.error || muxRes.statusText
          } catch (_parseError) {
            clientLogger.error('Error parsing error response', 'GoogleDriveButton', {
              status: muxRes.status,
              statusText: muxRes.statusText,
            })
          }
          throw new Error(`Failed to create Mux asset: ${errorMessage}`)
        }

        const result = await muxRes.json()

        // Create a File object to maintain compatibility with the existing code
        const resultFileObj = new File(
          [new Blob([''], { type: 'application/octet-stream' })],
          file.name,
          { type: mimeType },
        )

        // Add custom properties to the file object
        Object.defineProperties(resultFileObj, {
          muxAssetId: { value: result.data.asset.id, writable: true },
          muxPlaybackId: { value: result.data.asset.playbackId, writable: true },
          muxStatus: { value: result.data.asset.status, writable: true },
          fromUrl: { value: true, writable: true },
        })

        // Pass the file to the parent component
        onFileSelected(resultFileObj)

        // Show success toast
        toast({
          title: 'Upload successful',
          description: file.name,
        })
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error'
        toast({
          title: 'Upload failed',
          description: `${file.name}: ${errMsg}`,
          variant: 'destructive',
        })
        clientLogger.error('Error processing file from Google Drive', 'GoogleDriveButton', {
          error: errMsg,
          fileName: file.name,
        })
      }
    }
    setUploading(false)
  }

  return (
    <Button
      onClick={handleGoogleDriveClick}
      id="google-drive-button"
      disabled={isDisabled}
      variant="outline"
      title={
        !clientId || !apiKey
          ? 'Google Drive integration is not fully configured'
          : !gapiLoaded || !gisLoaded
            ? 'Google Drive SDK is loading...'
            : 'Choose video files from Google Drive'
      }
    >
      {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <FileBox className={uploading ? 'hidden' : 'mr-2 h-4 w-4'} />
      Choose from Google Drive (Multi)
    </Button>
  )
}
