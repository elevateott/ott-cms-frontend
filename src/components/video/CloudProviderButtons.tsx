'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import { fetchWithTimeout } from '@/utils/fetch'
import Script from 'next/script'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertTitle } from '../ui/alert'
import { useToast } from '@/hooks/use-toast'

// Import icons from lucide-react
import { Cloud as DropboxIcon, FileBox as GoogleDriveIcon } from 'lucide-react'

// Define interfaces for the cloud providers
interface DropboxOptions {
  success: (files: DropboxFile[]) => void
  cancel?: () => void
  linkType: string
  multiselect: boolean
  extensions: string[]
}

interface DropboxFile {
  name: string
  link: string
  bytes: number
  icon: string
  thumbnailLink?: string
  isDir: boolean
}

interface CloudIntegrationSettings {
  dropboxAppKey: string | null
  googleApiKey: string | null
  googleClientId: string | null
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

const CloudProviderButtons: React.FC<CloudProviderButtonsProps> = ({
  onFileSelected,
  disabled,
}) => {
  // We'll use the toast hook for future notifications if needed
  const { toast: _ } = useToast()
  const [dropboxLoaded, setDropboxLoaded] = useState(false)
  const [googleDriveLoaded, setGoogleDriveLoaded] = useState(false)
  const [settings, setSettings] = useState<CloudIntegrationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch cloud integration settings from the API
  useEffect(() => {
    let isMounted = true

    const fetchSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        clientLogger.info('Fetching cloud integration settings', 'CloudProviderButtons')

        // Use default empty settings first to prevent errors
        const defaultSettings = {
          dropboxAppKey: null,
          googleApiKey: null,
          googleClientId: null,
          onedriveClientId: null,
        }

        // Set default settings immediately to prevent null errors
        setSettings(defaultSettings)

        try {
          const response = await fetchWithTimeout(
            '/api/cloud-integrations',
            {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            },
            5000,
          ) // Reduced timeout to 5 seconds

          if (!isMounted) return

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()

          if (data.error) {
            throw new Error(data.error)
          }

          if (isMounted) {
            setSettings(data)
            clientLogger.info('Cloud integration settings loaded', 'CloudProviderButtons', data)
          }
        } catch (fetchError) {
          // Just log the error but continue with default settings
          const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
          clientLogger.warn(
            'Error fetching cloud integration settings, using defaults',
            'CloudProviderButtons',
            {
              error: errorMessage,
            },
          )
          setError(errorMessage)

          // We already set default settings above, so no need to do it again
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSettings()

    return () => {
      isMounted = false
    }
  }, [])

  // Dropbox integration
  const handleDropboxSelect = () => {
    if (!window.Dropbox) {
      clientLogger.error('Dropbox SDK not loaded', 'CloudProviderButtons', {
        error: new Error('Dropbox SDK not available'),
      })
      return
    }

    // Check if app key is available from settings
    const appKey = settings?.dropboxAppKey
    if (!appKey) {
      clientLogger.error('Dropbox app key not configured', 'CloudProviderButtons', {
        error: new Error('Missing configuration'),
      })
      return
    }

    try {
      window.Dropbox.choose({
        success: (files) => {
          if (files && files.length > 0) {
            const file = files[0]
            if (file && file.name) {
              clientLogger.info('File selected from Dropbox', 'CloudProviderButtons', {
                fileName: file.name,
              })

              // Check if direct link is available
              if (file.link) {
                // Download the file from Dropbox
                downloadFileFromUrl(file.link, file.name)
                  .then((fileObj) => {
                    onFileSelected(fileObj)
                  })
                  .catch((error) => {
                    clientLogger.error(
                      'Error downloading file from Dropbox',
                      'CloudProviderButtons',
                      {
                        error,
                      },
                    )
                    alert(
                      'Error downloading file from Dropbox. Please try again or use another upload method.',
                    )
                  })
              } else {
                clientLogger.error('File does not have a direct link', 'CloudProviderButtons')
                alert(
                  'This file cannot be downloaded directly. Please try another file or upload method.',
                )
              }
            } else {
              clientLogger.error('Invalid file object from Dropbox', 'CloudProviderButtons')
              alert('Invalid file selected. Please try again or use another upload method.')
            }
          }
        },
        cancel: () => {
          clientLogger.info('Dropbox selection cancelled', 'CloudProviderButtons')
        },
        linkType: 'direct',
        multiselect: false,
        extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
      })
    } catch (error) {
      clientLogger.error('Error initializing Dropbox chooser', 'CloudProviderButtons', { error })
      alert('There was an error initializing the Dropbox chooser. Please try again later.')
    }
  }

  // Google Drive integration
  const handleGoogleDriveSelect = () => {
    if (!window.gapi || !window.google?.picker) {
      clientLogger.error('Google Drive SDK not loaded', 'CloudProviderButtons', {
        error: new Error('Google Drive SDK not available'),
      })
      return
    }

    // Check if API key is available from settings
    const apiKey = settings?.googleApiKey
    if (!apiKey) {
      clientLogger.error('Google API key not configured', 'CloudProviderButtons', {
        error: new Error('Missing configuration'),
      })
      return
    }

    // This is a simplified version that doesn't require OAuth for public files
    const createPicker = () => {
      try {
        // Make sure the picker API is loaded
        if (!window.google?.picker) {
          clientLogger.error('Google Picker API not loaded', 'CloudProviderButtons')
          return
        }

        const picker = window.google.picker
        const view = new picker.View(picker.ViewId.DOCS_VIDEOS)
        view.setMimeTypes('video/mp4,video/quicktime,video/webm,video/x-matroska')

        // Create the picker without OAuth token for now (will only work with public files)
        const pickerInstance = new picker.PickerBuilder()
          .addView(view)
          .setDeveloperKey(apiKey)
          .setCallback((data: any) => {
            if (data.action === picker.Action.PICKED) {
              const file = data.docs[0]
              clientLogger.info('File selected from Google Drive', 'CloudProviderButtons', {
                fileName: file.name,
              })

              // For public files, we can use the downloadUrl directly
              if (file.downloadUrl) {
                downloadFileFromUrl(file.downloadUrl, file.name, false)
                  .then((fileObj) => {
                    onFileSelected(fileObj)
                  })
                  .catch((error) => {
                    clientLogger.error(
                      'Error downloading file from Google Drive',
                      'CloudProviderButtons',
                      { error },
                    )
                  })
              } else {
                // For private files, we would need OAuth, but for now just show an error
                clientLogger.error(
                  'File does not have a direct download URL',
                  'CloudProviderButtons',
                )
                alert(
                  'This file cannot be downloaded directly. Please make sure the file is public or use another upload method.',
                )
              }
            }
          })
          .build()

        pickerInstance.setVisible(true)
      } catch (error) {
        clientLogger.error('Error creating Google Picker', 'CloudProviderButtons', { error })
        alert('There was an error initializing the Google Drive picker. Please try again later.')
      }
    }

    // Initialize the Google Picker
    try {
      window.gapi.load('picker', () => {
        createPicker()
      })
    } catch (error) {
      clientLogger.error('Error loading Google Picker API', 'CloudProviderButtons', { error })
    }
  }

  // Helper function to download a file from a URL and convert it to a File object
  const downloadFileFromUrl = async (
    url: string,
    fileName: string,
    requiresAuth: boolean = false,
  ): Promise<File> => {
    try {
      clientLogger.info('Downloading file from URL', 'CloudProviderButtons', { url, fileName })

      const fetchOptions: RequestInit = {
        method: 'GET',
      }

      // Add authorization header if required (e.g., for Google Drive)
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
      const file = new File([blob], fileName, { type: mimeType })

      clientLogger.info('File downloaded successfully', 'CloudProviderButtons', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
      })

      return file
    } catch (error) {
      clientLogger.error('Error downloading file', 'CloudProviderButtons', { error })
      throw error
    }
  }

  // If loading, show a loading spinner with a timeout message
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="flex items-center mb-2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Loading cloud integrations...</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          If this takes too long, cloud integrations may not be configured yet.
        </p>
      </div>
    )
  }

  // If there's an error, show the buttons anyway but log the error
  if (error) {
    clientLogger.warn(
      'Error loading cloud integration settings, but showing buttons anyway',
      'CloudProviderButtons',
      { error },
    )
  }

  // If settings are still null (which shouldn't happen now), use empty settings
  if (!settings) {
    clientLogger.warn(
      'No cloud integration settings found, using empty settings',
      'CloudProviderButtons',
    )
    // Use a useEffect to set settings to avoid React state update during render
    // This is just a fallback that shouldn't be needed with our improved code
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Cloud storage integration is not available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* SDK Scripts */}
      {/* Always load Dropbox SDK, but only set app key if available */}
      <Script
        id="dropbox-sdk"
        src="https://www.dropbox.com/static/api/2/dropins.js"
        data-app-key={settings?.dropboxAppKey || ''}
        strategy="afterInteractive"
        onLoad={() => {
          clientLogger.info('Dropbox SDK loaded successfully', 'CloudProviderButtons')
          // Verify that the Dropbox object is actually available
          if (typeof window !== 'undefined' && window.Dropbox) {
            clientLogger.info('Dropbox object is available', 'CloudProviderButtons')
            setDropboxLoaded(true)
          } else {
            clientLogger.error(
              'Dropbox object not available after script load',
              'CloudProviderButtons',
            )
            // Try again after a short delay
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.Dropbox) {
                clientLogger.info(
                  'Dropbox object is now available after delay',
                  'CloudProviderButtons',
                )
                setDropboxLoaded(true)
              } else {
                clientLogger.error(
                  'Dropbox object still not available after delay',
                  'CloudProviderButtons',
                )
              }
            }, 1000)
          }
        }}
        onError={(e) => {
          clientLogger.error('Failed to load Dropbox SDK', 'CloudProviderButtons', { error: e })
        }}
      />

      <Script
        id="google-api-sdk"
        src="https://apis.google.com/js/api.js"
        strategy="afterInteractive"
        onLoad={() => {
          clientLogger.info('Google API SDK loaded successfully', 'CloudProviderButtons')
          // Verify that the gapi object is actually available
          if (typeof window !== 'undefined' && window.gapi) {
            clientLogger.info('Google API object is available', 'CloudProviderButtons')
            // Just load the picker API without authentication for now
            try {
              window.gapi.load('picker', () => {
                clientLogger.info('Google Picker API loaded successfully', 'CloudProviderButtons')
                setGoogleDriveLoaded(true)
              })
            } catch (error) {
              clientLogger.error('Error loading Google Picker API', 'CloudProviderButtons', {
                error,
              })
              // Try again after a short delay
              setTimeout(() => {
                try {
                  window.gapi?.load('picker', () => {
                    clientLogger.info(
                      'Google Picker API loaded successfully after delay',
                      'CloudProviderButtons',
                    )
                    setGoogleDriveLoaded(true)
                  })
                } catch (retryError) {
                  clientLogger.error(
                    'Error loading Google Picker API after delay',
                    'CloudProviderButtons',
                    { error: retryError },
                  )
                }
              }, 1000)
            }
          } else {
            clientLogger.error(
              'Google API object not available after script load',
              'CloudProviderButtons',
            )
            // Try again after a short delay
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.gapi) {
                clientLogger.info(
                  'Google API object is now available after delay',
                  'CloudProviderButtons',
                )
                try {
                  window.gapi.load('picker', () => {
                    clientLogger.info(
                      'Google Picker API loaded successfully after delay',
                      'CloudProviderButtons',
                    )
                    setGoogleDriveLoaded(true)
                  })
                } catch (error) {
                  clientLogger.error(
                    'Error loading Google Picker API after delay',
                    'CloudProviderButtons',
                    { error },
                  )
                }
              } else {
                clientLogger.error(
                  'Google API object still not available after delay',
                  'CloudProviderButtons',
                )
              }
            }, 1000)
          }
        }}
        onError={(e) => {
          clientLogger.error('Failed to load Google API SDK', 'CloudProviderButtons', { error: e })
        }}
      />

      {/* Cloud Provider Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={handleDropboxSelect}
          disabled={disabled || !settings?.dropboxAppKey || !dropboxLoaded}
          variant="outline"
        >
          <DropboxIcon className="mr-2 h-4 w-4" />
          Choose from Dropbox
        </Button>

        <Button
          onClick={handleGoogleDriveSelect}
          disabled={
            disabled || !settings?.googleApiKey || !settings?.googleClientId || !googleDriveLoaded
          }
          variant="outline"
        >
          <GoogleDriveIcon className="mr-2 h-4 w-4" />
          Choose from Google Drive
        </Button>
      </div>

      {/* Configuration message - only show if no integrations are configured */}
      {!settings?.dropboxAppKey && !settings?.googleApiKey && (
        <Alert variant="default" className="mt-4 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-700 font-medium">
            Cloud Storage Integration Not Configured
          </AlertTitle>
          <div className="text-sm text-blue-600 mt-2">
            <p className="mb-2">
              To enable cloud storage integration, please configure your credentials in Cloud
              Integrations:
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Navigate to{' '}
                <span className="font-mono">System Settings &gt; Cloud Integrations</span>
              </li>
              <li>Enter your API credentials for each cloud provider you wish to use</li>
            </ol>
          </div>
        </Alert>
      )}
    </div>
  )
}

export default CloudProviderButtons
