'use client'

import { clientLogger } from '@/utils/clientLogger'

/**
 * VideoAdmin Component
 *
 * An enhanced component for managing videos in the admin panel
 */

import React, { useState, useEffect } from 'react'
import { cn } from '@/utilities/ui'
import MuxVideoUploader from './MuxVideoUploader'
import EmbeddedVideoUploader from './EmbeddedVideoUploader'
import MuxUploaderStyles from './MuxUploaderStyles'
import Script from 'next/script'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export type VideoAdminProps = React.HTMLAttributes<HTMLDivElement>

/**
 * DeleteAllVideos Component
 *
 * A component that provides a button to delete all videos in the system
 */
const DeleteAllVideos: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleDeleteAllVideos = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      setSuccess(false)

      // Call the API to delete all video assets
      const response = await fetch('/api/videoassets/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete video assets')
      }

      const result = await response.json()
      setSuccess(true)
      clientLogger.info('All video assets deleted successfully:', result)

      // Show success toast
      toast({
        title: 'Success',
        description: `Successfully deleted ${result.deletedCount} video assets`,
        variant: 'default',
      })

      // Close the dialog after a short delay
      setTimeout(() => {
        setIsOpen(false)
        // Reload the page to reflect changes
        window.location.reload()
      }, 1500)
    } catch (err) {
      clientLogger.error('Error deleting videos:', err, 'videoVideoAdmin')
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)

      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Video Assets
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white border border-gray-200 shadow-lg text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete All Video Assets
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              This action will permanently delete ALL video assets from the system. This cannot be
              undone. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              All video assets have been successfully deleted.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllVideos}
              disabled={isDeleting}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete All Video Assets'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * DeleteAllMuxVideos Component
 *
 * A component that provides a button to delete all videos in Mux
 */
const DeleteAllMuxVideos: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const { toast } = useToast()

  const handleDeleteAllMuxVideos = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      setSuccess(false)
      setProgress(null)

      // Call the API to delete all Mux videos
      const response = await fetch('/api/mux/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        let errorMessage = `Failed to delete Mux videos: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData && errorData.message) {
            errorMessage = errorData.message
          }
        } catch (jsonError) {
          // If we can't parse the JSON, just use the default error message
          clientLogger.error('Error parsing error response JSON:', String(jsonError))
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setSuccess(true)
      setProgress({ current: result.count, total: result.totalCount })
      clientLogger.info('All Mux videos deleted successfully:', result)

      // Show success toast with detailed information
      toast({
        title: 'Success',
        description: `Successfully deleted ${result.count} Mux videos${result.failedCount ? `, failed to delete ${result.failedCount}` : ''}`,
        variant: 'default',
      })

      // Close the dialog after a short delay
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      clientLogger.error('Error deleting Mux videos:', String(err))
      setError(errorMessage)

      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Mux Videos
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white border border-gray-200 shadow-lg text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete All Mux Videos
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              This action will permanently delete ALL videos from Mux. This cannot be undone. Note:
              This will not delete videos from the CMS database. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="font-medium">Mux videos deletion complete.</p>
              {progress && (
                <p className="text-sm mt-1">
                  Successfully deleted {progress.current} of {progress.total} videos.
                  {progress.current < progress.total && (
                    <span className="text-yellow-600">
                      {' '}
                      Failed to delete {progress.total - progress.current} videos.
                    </span>
                  )}
                </p>
              )}
              <p className="text-sm mt-1">Check the browser console for detailed logs.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllMuxVideos}
              disabled={isDeleting}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting
                ? progress
                  ? `Deleting... (${progress.current}/${progress.total})`
                  : 'Deleting...'
                : 'Delete All Mux Videos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const VideoAdmin: React.FC<VideoAdminProps> = ({ className, ...props }) => {
  const [sourceType, setSourceType] = useState<'mux' | 'embedded'>('mux')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // DRM settings
  const [overrideDRM, setOverrideDRM] = useState(false)
  const [useDRM, setUseDRM] = useState(false)
  const [drmConfigId, setDrmConfigId] = useState('')

  // Global settings
  const [streamingSourceTypes, setStreamingSourceTypes] = useState<'Mux' | 'Embedded' | 'Both'>(
    'Both',
  )
  const [globalDRMEnabled, setGlobalDRMEnabled] = useState(false)
  const [globalDRMConfigId, setGlobalDRMConfigId] = useState('')
  const [_isLoadingSettings, setIsLoadingSettings] = useState(true)

  // Mux credentials state
  const [hasMuxCredentials, setHasMuxCredentials] = useState(false)
  const [missingMuxCredentials, setMissingMuxCredentials] = useState<string[]>([])

  // Fetch global streaming settings
  useEffect(() => {
    const fetchStreamingSettings = async () => {
      try {
        setIsLoadingSettings(true)
        const response = await fetch('/api/globals/streaming-settings')

        if (!response.ok) {
          throw new Error('Failed to fetch streaming settings')
        }

        const data = await response.json()
        const sourceTypes = data.streamingSourceTypes || 'Both'
        setStreamingSourceTypes(sourceTypes)

        // Set default source type based on global settings
        if (sourceTypes === 'Mux') {
          setSourceType('mux')
        } else if (sourceTypes === 'Embedded') {
          setSourceType('embedded')
        }

        // Load DRM settings
        const muxSettings = data.muxSettings || {}
        setGlobalDRMEnabled(muxSettings.enableDRMByDefault || false)
        setGlobalDRMConfigId(muxSettings.defaultDRMConfigurationId || '')

        // If not overriding, use global settings
        if (!overrideDRM) {
          setUseDRM(muxSettings.enableDRMByDefault || false)
          setDrmConfigId(muxSettings.defaultDRMConfigurationId || '')
        }

        // Check for Mux credentials
        const apiCredentials = muxSettings.apiCredentials || {}
        const missing: string[] = []

        // Check for required credentials
        if (!apiCredentials.tokenId) missing.push('tokenId')
        if (!apiCredentials.tokenSecret) missing.push('tokenSecret')
        if (!apiCredentials.webhookSecret) missing.push('webhookSecret')

        // Set state based on credential check
        setHasMuxCredentials(missing.length === 0)
        setMissingMuxCredentials(missing)

        clientLogger.info('Streaming settings loaded', 'videoVideoAdmin', {
          streamingSourceTypes: sourceTypes,
          globalDRMEnabled: muxSettings.enableDRMByDefault,
          globalDRMConfigId: muxSettings.defaultDRMConfigurationId,
          hasMuxCredentials: missing.length === 0,
          missingCredentials: missing,
        })
      } catch (error) {
        clientLogger.error(
          error instanceof Error ? error : 'Error fetching streaming settings',
          'videoVideoAdmin',
        )
        // Set default values for error state
        setHasMuxCredentials(false)
        setMissingMuxCredentials(['tokenId', 'tokenSecret', 'webhookSecret'])
      } finally {
        setIsLoadingSettings(false)
      }
    }

    fetchStreamingSettings()
  }, [overrideDRM])

  // Set loading to false after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // 1.5 second delay

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={cn('space-y-6 w-full max-w-full', className)} {...props}>
      {/* Add the styles component */}
      <MuxUploaderStyles />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Add New Video</h1>
        <div className="flex space-x-2">
          <DeleteAllVideos />
          <DeleteAllMuxVideos />
        </div>
      </div>

      {/* Source Type Selection */}
      <div className="space-y-4 p-6 bg-white rounded-lg border">
        {isLoading ? (
          // Show loader while component is initializing
          <div className="w-full h-48 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Loading video uploader...</p>
          </div>
        ) : (
          <>
            {/* Only show source type dropdown if global setting is "Both" */}
            {streamingSourceTypes === 'Both' && (
              <div className="space-y-2">
                <Label htmlFor="sourceType">Video Source Type</Label>
                <Select
                  value={sourceType}
                  onValueChange={(value: 'mux' | 'embedded') => setSourceType(value)}
                  disabled={isUploading}
                >
                  <SelectTrigger
                    id="sourceType"
                    className={`w-48 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mux">Mux Upload</SelectItem>
                    <SelectItem value="embedded">Embedded URL</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Upload a video file directly to Mux, or switch to Embedded URL to use an existing
                  HLS stream.
                </p>
              </div>
            )}

            {/* DRM Options - only show for Mux uploads */}
            {(sourceType === 'mux' || streamingSourceTypes === 'Mux') && (
              <div className="space-y-4 mt-4 p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium">DRM Settings</h3>
                  {globalDRMEnabled && !overrideDRM && (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Using Global Settings
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-500 mb-2">
                  <p>
                    DRM (Digital Rights Management) protects your videos from unauthorized
                    downloading and copying.
                  </p>
                  {globalDRMEnabled && (
                    <p className="mt-1 font-medium">
                      Global setting: DRM is <span className="text-green-600">enabled</span> by
                      default.
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="overrideDRM"
                    checked={overrideDRM}
                    onChange={(e) => {
                      setOverrideDRM(e.target.checked)
                      if (!e.target.checked) {
                        // Reset to global defaults when not overriding
                        setUseDRM(globalDRMEnabled)
                        setDrmConfigId(globalDRMConfigId)
                      }
                    }}
                    disabled={isUploading}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="overrideDRM" className="text-sm font-medium text-gray-700">
                    Override Global DRM Settings
                  </Label>
                </div>

                {overrideDRM && (
                  <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="useDRM"
                        checked={useDRM}
                        onChange={(e) => setUseDRM(e.target.checked)}
                        disabled={isUploading}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="useDRM" className="text-sm font-medium text-gray-700">
                        Enable DRM Protection (Widevine / FairPlay)
                      </Label>
                    </div>

                    {useDRM && (
                      <div className="space-y-2">
                        <Label htmlFor="drmConfigId" className="text-sm font-medium text-gray-700">
                          DRM Configuration ID
                        </Label>
                        <Input
                          id="drmConfigId"
                          value={drmConfigId}
                          onChange={(e) => setDrmConfigId(e.target.value)}
                          disabled={isUploading}
                          placeholder="Enter Mux DRM Configuration ID"
                          className="w-full max-w-md"
                        />
                        <p className="text-xs text-gray-500">
                          Enter the Mux DRM Configuration ID for this video.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Show appropriate component based on source type */}
            {/* Mux Uploader - shown when sourceType is 'mux' */}
            {(sourceType === 'mux' || streamingSourceTypes === 'Mux') && (
              <>
                {/* Check if required Mux credentials are missing */}
                {missingMuxCredentials.length > 0 &&
                missingMuxCredentials.some(
                  (cred) =>
                    cred === 'tokenId' || cred === 'tokenSecret' || cred === 'webhookSecret',
                ) ? (
                  <div className="p-6 border-2 border-dashed border-yellow-400 rounded-lg bg-yellow-50">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-yellow-800">
                          Mux Configuration Required
                        </h3>
                        <p className="text-yellow-700">
                          To use Mux video uploads, you need to configure your Mux API credentials
                          in the global settings.
                        </p>
                        <div className="bg-white p-3 rounded border border-yellow-200 text-sm">
                          <p className="font-medium text-gray-700 mb-1">Missing credentials:</p>
                          <ul className="list-disc list-inside space-y-1 text-gray-600">
                            {missingMuxCredentials.includes('tokenId') && <li>Mux API Token ID</li>}
                            {missingMuxCredentials.includes('tokenSecret') && (
                              <li>Mux API Token Secret</li>
                            )}
                            {missingMuxCredentials.includes('webhookSecret') && (
                              <li>Mux Webhook Secret</li>
                            )}
                          </ul>
                        </div>
                        <div className="pt-2">
                          <p className="text-sm text-gray-600">
                            Go to{' '}
                            <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                              Settings → Streaming Settings
                            </span>{' '}
                            in the admin panel to configure these credentials.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Load preload script with highest priority */}
                    <Script
                      id="mux-uploader-preload-admin"
                      strategy="afterInteractive"
                      src="/mux-uploader-preload.js"
                      onLoad={() => {
                        clientLogger.info(
                          'Mux Uploader preload script loaded in VideoAdmin',
                          'videoVideoAdmin',
                        )
                      }}
                    />
                    <MuxVideoUploader
                      endpoint={async (file?: File) => {
                        if (!file) return '' // Return empty string if no file provided

                        try {
                          // Determine if DRM should be enabled based on override settings
                          const shouldUseDRM = overrideDRM ? useDRM : globalDRMEnabled
                          const drmConfigurationId = overrideDRM ? drmConfigId : globalDRMConfigId

                          // Validate DRM configuration
                          if (shouldUseDRM && !drmConfigurationId) {
                            clientLogger.warn(
                              'DRM enabled but no configuration ID provided',
                              'videoVideoAdmin',
                            )
                            throw new Error(
                              'DRM is enabled but no DRM Configuration ID is provided. Please enter a DRM Configuration ID or disable DRM.',
                            )
                          }

                          clientLogger.info(
                            'Creating Mux upload with DRM settings',
                            'videoVideoAdmin',
                            {
                              overrideDRM,
                              useDRM: shouldUseDRM,
                              drmConfigId: drmConfigurationId,
                              globalDRMEnabled,
                              globalDRMConfigId,
                            },
                          )

                          // Set a timeout for the fetch request
                          const controller = new AbortController()
                          const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

                          try {
                            const response = await fetch('/api/mux/direct-upload', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                filename: file.name,
                                enableDRM: shouldUseDRM,
                                drmConfigurationId: shouldUseDRM ? drmConfigurationId : undefined,
                                overrideDRM: overrideDRM,
                              }),
                              signal: controller.signal,
                            })

                            // Clear the timeout since the request completed
                            clearTimeout(timeoutId)

                            if (!response.ok) {
                              const errorData = await response.json()
                              throw new Error(
                                errorData.error ||
                                  `Server responded with status ${response.status}`,
                              )
                            }

                            const result = await response.json()

                            if (!result.data?.url) {
                              throw new Error('Invalid upload URL response')
                            }

                            return result.data.url // Return the URL string directly
                          } catch (fetchError) {
                            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                              throw new Error('Request timed out. Please try again.')
                            }
                            throw fetchError
                          }
                        } catch (error) {
                          clientLogger.error('Error creating Mux upload', 'videoVideoAdmin', {
                            error: error instanceof Error ? error.message : 'Unknown error',
                          })
                          throw error
                        }
                      }}
                      onUploadingStateChange={setIsUploading}
                    />
                  </>
                )}
              </>
            )}

            {/* Embedded Video Uploader - shown when sourceType is 'embedded' */}
            {(sourceType === 'embedded' || streamingSourceTypes === 'Embedded') && (
              <div className="mt-6">
                <EmbeddedVideoUploader />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default VideoAdmin
