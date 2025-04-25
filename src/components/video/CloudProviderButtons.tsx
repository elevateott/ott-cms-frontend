'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import Script from 'next/script'
import { Loader2 } from 'lucide-react'

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

interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  downloadUrl?: string
}

interface OneDriveFile {
  name: string
  size: number
  '@microsoft.graph.downloadUrl': string
}

interface CloudIntegrationSettings {
  dropboxAppKey: string | null
  googleApiKey: string | null
  googleClientId: string | null
  onedriveClientId: string | null
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
    OneDrive?: {
      open: (options: any) => void
    }
  }
}

const CloudProviderButtons: React.FC<CloudProviderButtonsProps> = ({
  onFileSelected,
  disabled,
}) => {
  const [dropboxLoaded, setDropboxLoaded] = useState(false)
  const [googleDriveLoaded, setGoogleDriveLoaded] = useState(false)
  const [oneDriveLoaded, setOneDriveLoaded] = useState(false)
  const [settings, setSettings] = useState<CloudIntegrationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch cloud integration settings from the API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        clientLogger.info('Fetching cloud integration settings', 'CloudProviderButtons')

        // Add a timeout to the fetch request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        try {
          const response = await fetch('/api/cloud-integrations', {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`Failed to fetch cloud integration settings: ${response.status}`)
          }

          const data = await response.json()

          // Check if we got an error message in the response
          if (data.error) {
            clientLogger.warn(
              'Received error in cloud integration settings response',
              'CloudProviderButtons',
              {
                error: data.error,
              },
            )
          }

          setSettings(data)
          clientLogger.info('Cloud integration settings loaded', 'CloudProviderButtons', {
            settings: data,
          })
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') {
            clientLogger.error('Fetch request timed out', 'CloudProviderButtons')
            throw new Error('Request timed out. Please try again.')
          }
          throw fetchError
        }
      } catch (error) {
        clientLogger.error('Error fetching cloud integration settings', 'CloudProviderButtons', {
          error,
        })
        setError('Failed to load cloud integration settings. Using default settings.')

        // Use default settings
        setSettings({
          dropboxAppKey: null,
          googleApiKey: null,
          googleClientId: null,
          onedriveClientId: null,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()

    // Add a fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (loading) {
        clientLogger.warn('Fallback timeout triggered for cloud settings', 'CloudProviderButtons')
        setLoading(false)
        setSettings({
          dropboxAppKey: null,
          googleApiKey: null,
          googleClientId: null,
          onedriveClientId: null,
        })
      }
    }, 15000) // 15 seconds fallback

    return () => clearTimeout(fallbackTimeout)
  }, [])

  // Dropbox integration
  const handleDropboxSelect = () => {
    if (!window.Dropbox) {
      clientLogger.error('Dropbox SDK not loaded', 'CloudProviderButtons')
      return
    }

    // Check if app key is available from settings
    const appKey = settings?.dropboxAppKey
    if (!appKey) {
      clientLogger.error('Dropbox app key not configured', 'CloudProviderButtons')
      alert(
        'Dropbox integration is not configured. Please go to the CMS admin panel, navigate to "System Settings > Cloud Integrations" and enter your Dropbox App Key.',
      )
      return
    }

    try {
      window.Dropbox.choose({
        success: (files) => {
          if (files && files.length > 0) {
            const file = files[0]
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
      clientLogger.error('Google Drive SDK not loaded', 'CloudProviderButtons')
      return
    }

    // Check if API key is available from settings
    const apiKey = settings?.googleApiKey
    if (!apiKey) {
      clientLogger.error('Google API key not configured', 'CloudProviderButtons')
      alert(
        'Google Drive integration is not configured. Please go to the CMS admin panel, navigate to "System Settings > Cloud Integrations" and enter your Google API Key.',
      )
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

  // OneDrive integration
  const handleOneDriveSelect = () => {
    // Check if OneDrive SDK is available
    if (typeof window === 'undefined' || !window.OneDrive) {
      clientLogger.error('OneDrive SDK not loaded or not available', 'CloudProviderButtons')
      alert('OneDrive integration is not available. The SDK failed to load properly.')
      return
    }

    // Check if client ID is available from settings
    const clientId = settings?.onedriveClientId
    if (!clientId) {
      clientLogger.error('OneDrive client ID not configured', 'CloudProviderButtons')
      alert(
        'OneDrive integration is not configured. Please go to the CMS admin panel, navigate to "System Settings > Cloud Integrations" and enter your OneDrive Client ID.',
      )
      return
    }

    // Wrap the entire operation in a try-catch to handle any unexpected errors
    try {
      clientLogger.info('Initializing OneDrive picker', 'CloudProviderButtons', { clientId })

      // Define the options for the OneDrive picker
      const options = {
        clientId: clientId,
        action: 'download',
        multiSelect: false,
        advanced: { filter: '.mp4,.mov,.avi,.webm,.mkv' },
        success: (response: any) => {
          try {
            clientLogger.info('OneDrive selection successful', 'CloudProviderButtons', { response })

            // Validate the response
            if (
              !response ||
              !response.value ||
              !Array.isArray(response.value) ||
              response.value.length === 0
            ) {
              clientLogger.error('Invalid response from OneDrive', 'CloudProviderButtons', {
                response,
              })
              alert(
                'Invalid response from OneDrive. Please try again or use another upload method.',
              )
              return
            }

            const file = response.value[0]
            clientLogger.info('File selected from OneDrive', 'CloudProviderButtons', {
              fileName: file.name,
              fileSize: file.size,
            })

            // Check if download URL is available
            if (file['@microsoft.graph.downloadUrl']) {
              // Download the file from OneDrive
              downloadFileFromUrl(file['@microsoft.graph.downloadUrl'], file.name)
                .then((fileObj) => {
                  onFileSelected(fileObj)
                })
                .catch((error) => {
                  clientLogger.error(
                    'Error downloading file from OneDrive',
                    'CloudProviderButtons',
                    {
                      error,
                    },
                  )
                  alert(
                    'Error downloading file from OneDrive. Please try again or use another upload method.',
                  )
                })
            } else {
              clientLogger.error('File does not have a download URL', 'CloudProviderButtons', {
                file,
              })
              alert(
                'This file cannot be downloaded directly. Please try another file or upload method.',
              )
            }
          } catch (error) {
            clientLogger.error('Error processing OneDrive response', 'CloudProviderButtons', {
              error,
              response,
            })
            alert(
              'Error processing the selected file. Please try again or use another upload method.',
            )
          }
        },
        cancel: () => {
          clientLogger.info('OneDrive selection cancelled', 'CloudProviderButtons')
        },
        error: (error: any) => {
          clientLogger.error('Error selecting file from OneDrive', 'CloudProviderButtons', {
            error,
          })
          alert('Error selecting file from OneDrive. Please try again later.')
        },
      }

      // Call the OneDrive picker with the options
      clientLogger.info('Opening OneDrive picker', 'CloudProviderButtons')
      window.OneDrive.open(options)
      clientLogger.info('OneDrive picker opened successfully', 'CloudProviderButtons')
    } catch (error) {
      clientLogger.error('Error initializing OneDrive picker', 'CloudProviderButtons', { error })
      alert('There was an error initializing the OneDrive picker. Please try again later.')
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

  // If settings are null, use empty settings but show the buttons
  if (!settings) {
    clientLogger.warn(
      'No cloud integration settings found, using empty settings',
      'CloudProviderButtons',
    )
    setSettings({
      dropboxAppKey: null,
      googleApiKey: null,
      googleClientId: null,
      onedriveClientId: null,
    })
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

      {/* Always load OneDrive SDK */}
      <Script
        id="onedrive-sdk"
        src="https://js.live.net/v7.2/OneDrive.js"
        strategy="afterInteractive"
        onLoad={() => {
          clientLogger.info('OneDrive SDK loaded successfully', 'CloudProviderButtons')
          // Verify that the OneDrive object is actually available
          if (typeof window !== 'undefined' && window.OneDrive) {
            clientLogger.info('OneDrive object is available', 'CloudProviderButtons')
            setOneDriveLoaded(true)
          } else {
            clientLogger.error(
              'OneDrive object not available after script load',
              'CloudProviderButtons',
            )
            // Try again after a short delay
            setTimeout(() => {
              if (typeof window !== 'undefined' && window.OneDrive) {
                clientLogger.info(
                  'OneDrive object is now available after delay',
                  'CloudProviderButtons',
                )
                setOneDriveLoaded(true)
              } else {
                clientLogger.error(
                  'OneDrive object still not available after delay',
                  'CloudProviderButtons',
                )
              }
            }, 1000)
          }
        }}
        onError={(e) => {
          clientLogger.error('Failed to load OneDrive SDK', 'CloudProviderButtons', { error: e })
        }}
      />

      {/* Cloud Provider Buttons */}
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDropboxSelect}
          disabled={disabled || !dropboxLoaded}
          className="flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M6 9.5L12 14L18 9.5L12 5L6 9.5Z" fill="#0061FF" />
            <path d="M6 14.5L12 19L18 14.5L12 10L6 14.5Z" fill="#0061FF" />
          </svg>
          Choose from Dropbox
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGoogleDriveSelect}
          disabled={disabled || !googleDriveLoaded}
          className="flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4.5 14L8 19H16L12.5 14H4.5Z" fill="#0F9D58" />
            <path d="M12 5L8 14H16L20 5H12Z" fill="#4285F4" />
            <path d="M12 5L8 14L4.5 14L8.5 5H12Z" fill="#FBBC04" />
          </svg>
          Choose from Google Drive
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleOneDriveSelect}
          disabled={disabled || !oneDriveLoaded}
          className="flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 6L6 14H14L18 6H10Z" fill="#0364B8" />
            <path d="M6 14L4 18H12L14 14H6Z" fill="#0078D4" />
            <path d="M14 14L12 18H20L18 14H14Z" fill="#1490DF" />
          </svg>
          Choose from OneDrive
        </Button>
      </div>

      {/* Configuration message - only show if no integrations are configured */}
      {(!settings?.dropboxAppKey && !settings?.googleApiKey && !settings?.onedriveClientId) && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            To enable cloud storage integration, please configure your credentials in the CMS admin panel:
          </p>
          <ol className="mt-2 text-sm text-blue-600 list-decimal list-inside">
            <li>Go to the CMS admin panel</li>
            <li>Navigate to <span className="font-mono">System Settings &gt; Cloud Integrations</span></li>
            <li>Enter your API credentials for each cloud provider</li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default CloudProviderButtons

