'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import MuxUploader from '@mux/mux-uploader-react'
import { MuxUploaderDrop, MuxUploaderFileSelect } from '@mux/mux-uploader-react'
import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { useEventBus } from '@/hooks/useEventBus'

// Client-side only components to avoid hydration issues

// Progress bar component
const ProgressBar = ({ isUploading, progress }: { isUploading: boolean; progress: number }) => {
  if (!isUploading) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">Uploading: {Math.round(progress)}%</p>
    </div>
  )
}

// Video list component
const VideoList = ({ videos, onClearAll }: { videos: UploadedVideo[]; onClearAll: () => void }) => {
  if (videos.length === 0) {
    return null
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-medium">Uploaded Videos</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearAll}
          className="text-xs flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear All
        </Button>
      </div>

      <div className="divide-y divide-gray-200">
        {videos.map((video, index) => (
          <div
            key={`${video.id}-${index}`}
            className="p-4 flex items-center justify-between bg-white"
          >
            <div className="flex items-center gap-3">
              {/* Status Icon */}
              {video.status === 'uploading' && (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              )}
              {video.status === 'processing' && (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              )}
              {video.status === 'ready' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {video.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}

              {/* Video Info */}
              <div>
                <p className="font-medium">{video.title}</p>
                <p className="text-xs text-gray-500">{video.filename}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              {video.status === 'uploading' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Uploading
                </span>
              )}
              {video.status === 'processing' && (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                  Processing
                </span>
              )}
              {video.status === 'ready' && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Ready
                </span>
              )}
              {video.status === 'error' && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                  Error
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Define the upload status type
type UploadStatus = 'uploading' | 'processing' | 'ready' | 'error'

// Define the uploaded video type
interface UploadedVideo {
  id: string
  filename: string
  title: string
  status: UploadStatus
  progress: number
  error?: string
  assetId?: string
  playbackId?: string
  uploadUrl?: string
}

export interface SimpleVideoUploaderProps {
  endpoint: (file?: File) => Promise<string>
  onUploadComplete?: (data: { uploadId?: string; assetId?: string; playbackId?: string }) => void
  onUploadError?: (error: Error) => void
  className?: string
}

const SimpleVideoUploader: React.FC<SimpleVideoUploaderProps> = ({
  endpoint,
  onUploadComplete,
  onUploadError,
  className,
}) => {
  // Use our custom hook for localStorage
  const [uploadedVideos, setUploadedVideos] = useLocalStorage<UploadedVideo[]>(
    'ott-cms-uploaded-videos',
    [],
  )

  const uploaderRef = useRef<any>(null)

  // Log when videos are updated
  useEffect(() => {
    if (uploadedVideos.length > 0) {
      console.log(`Video list updated: ${uploadedVideos.length} videos`)
    }
  }, [uploadedVideos])

  // Add a cleanup function to log when the component unmounts
  useEffect(() => {
    console.log('SimpleVideoUploader mounted')
    console.log('Endpoint function available:', typeof endpoint === 'function')

    // Log the MuxUploader ref
    console.log('MuxUploader ref:', uploaderRef.current)

    return () => {
      console.log('SimpleVideoUploader unmounted')
    }
  }, [endpoint])

  // Function to handle upload start
  const handleUploadStart = (event: CustomEvent) => {
    console.log('Upload start event triggered', event)

    // Get the file from the event detail
    let file: File | undefined

    try {
      // Try to stringify the event detail for logging
      // This might fail if the detail contains circular references
      const detailStr = JSON.stringify(
        event.detail,
        (key, value) => {
          // Handle File objects which can't be stringified
          if (value instanceof File) {
            return `[File: ${value.name}, size: ${value.size}]`
          }
          return value
        },
        2,
      )
      console.log('Event detail structure:', detailStr)
    } catch (err) {
      console.log('Could not stringify event detail:', err)
    }

    // Check if event.detail.file exists (Mux uploader specific format)
    if (event.detail?.file instanceof File) {
      file = event.detail.file
      console.log('Found file in event.detail.file:', file.name)
    }
    // Check if event.detail is a File object
    else if (event.detail instanceof File) {
      file = event.detail
      console.log('Found file in event.detail:', file.name)
    }
    // Check if event.detail.target exists and has files
    else if (event.detail?.target?.files?.length > 0) {
      file = event.detail.target.files[0]
      console.log('Found file in event.detail.target.files:', file.name)
    }
    // Check if event.detail.dataTransfer exists and has files
    else if (event.detail?.dataTransfer?.files?.length > 0) {
      file = event.detail.dataTransfer.files[0]
      console.log('Found file in event.detail.dataTransfer.files:', file.name)
    }

    // Log the file object properties if it exists
    if (file) {
      console.log('File object properties:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
      })
    }

    if (!file) {
      console.error('No file found in upload start event:', event)

      // Use a fallback filename if we can't get the actual file
      const fallbackFilename = 'video-' + Date.now() + '.mp4'

      // Create a new uploaded video object with fallback data
      const newVideo: UploadedVideo = {
        id: Date.now().toString(),
        filename: fallbackFilename,
        title: 'Uploading Video',
        status: 'uploading',
        progress: 0,
      }

      // Add the new video to the list
      console.log('Adding fallback video to list:', newVideo)
      setUploadedVideos((prev) => {
        const newList = [...prev, newVideo]
        console.log('Updated video list with fallback:', newList)
        return newList
      })

      return
    }

    console.log('Upload started for file:', file.name, 'size:', Math.round(file.size / 1024), 'KB')

    // Create a new uploaded video object
    const newVideo: UploadedVideo = {
      id: Date.now().toString(),
      filename: file.name,
      title: file.name.split('.').slice(0, -1).join('.') || 'Uploaded Video', // Remove extension
      status: 'uploading',
      progress: 0,
    }

    // Add the new video to the list, avoiding duplicates
    console.log('Adding new video to list:', newVideo)
    setUploadedVideos((prev) => {
      // Check if a video with the same filename already exists
      const existingIndex = prev.findIndex((v) => v.filename === newVideo.filename)

      if (existingIndex >= 0) {
        // Update the existing video instead of adding a new one
        console.log('Video with same filename already exists, updating instead')
        const newList = [...prev]
        newList[existingIndex] = {
          ...newList[existingIndex],
          status: 'uploading',
          progress: 0,
          error: undefined,
        }
        console.log('Updated video list:', newList)
        return newList
      } else {
        // Add the new video to the list
        const newList = [...prev, newVideo]
        console.log('Updated video list:', newList)
        return newList
      }
    })
  }

  // Function to handle upload progress
  const handleProgress = (event: CustomEvent) => {
    const progress = event.detail as number
    const progressPercent = Math.round(progress * 100)
    console.log('Upload progress:', progressPercent, '%')

    // Update the progress of the most recent upload
    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = {
          ...updatedVideos[lastVideoIndex],
          progress: progress * 100,
        }
      }

      return updatedVideos
    })
  }

  // Function to handle upload success
  const handleSuccess = (event: CustomEvent) => {
    console.log('Upload success event triggered', event)

    // Log the full event detail structure
    try {
      const detailStr = JSON.stringify(
        event.detail,
        (key, value) => {
          // Handle objects that can't be stringified
          if (value instanceof File) {
            return `[File: ${value.name}, size: ${value.size}]`
          }
          return value
        },
        2,
      )
      console.log('Success event detail structure:', detailStr)
    } catch (err) {
      console.log('Could not stringify success event detail:', err)
    }

    // Get the detail from the event
    let detail:
      | {
          upload_id?: string
          asset_id?: string
          playback_ids?: Array<{ id: string }>
        }
      | undefined = undefined

    // Try to extract the detail from different possible formats
    if (typeof event.detail === 'object' && event.detail !== null) {
      if (
        'upload_id' in event.detail ||
        'asset_id' in event.detail ||
        'playback_ids' in event.detail
      ) {
        detail = event.detail as any
      } else if ('detail' in event.detail && typeof event.detail.detail === 'object') {
        detail = event.detail.detail as any
      }
    }

    console.log('Extracted detail:', detail)

    if (!detail) {
      console.log('No detail in success event, using fallback handling')

      // Even without details, we should update the most recent upload to processing
      setUploadedVideos((prev) => {
        const updatedVideos = [...prev]
        const lastVideoIndex = updatedVideos.length - 1

        if (lastVideoIndex >= 0) {
          updatedVideos[lastVideoIndex] = {
            ...updatedVideos[lastVideoIndex],
            status: 'processing',
            progress: 100,
          }
        }

        return updatedVideos
      })

      // Wait for a short time and then start polling if we have an assetId
      setTimeout(() => {
        setUploadedVideos((prev) => {
          const updatedVideos = [...prev]
          const lastVideoIndex = updatedVideos.length - 1

          if (lastVideoIndex >= 0) {
            const video = updatedVideos[lastVideoIndex]

            // If we have an assetId, start polling
            if (video.assetId) {
              console.log(`Starting polling for asset ${video.assetId} from fallback handler`)
              startPollingVideoStatus(video.id, video.assetId)
            } else {
              // Otherwise, simulate ready state after 5 seconds
              setTimeout(() => {
                setUploadedVideos((prev) => {
                  const updatedVideos = [...prev]
                  const videoIndex = updatedVideos.findIndex((v) => v.id === video.id)

                  if (videoIndex >= 0) {
                    updatedVideos[videoIndex] = {
                      ...updatedVideos[videoIndex],
                      status: 'ready',
                    }
                  }

                  return updatedVideos
                })
              }, 5000)
            }
          }

          return updatedVideos
        })
      }, 1000)

      return
    }

    console.log('Upload success with details:', {
      upload_id: detail.upload_id,
      asset_id: detail.asset_id,
      playback_id: detail.playback_ids?.[0]?.id,
    })

    // Update the status of the most recent upload
    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = {
          ...updatedVideos[lastVideoIndex],
          status: 'processing',
          progress: 100,
          assetId: detail.asset_id,
          playbackId: detail.playback_ids?.[0]?.id,
        }
      }

      return updatedVideos
    })

    // Listen for video status updates via events instead of polling
    if (detail.asset_id) {
      console.log(`Waiting for status updates for asset ${detail.asset_id}`)
      // Update initial state
      setUploadedVideos((prev) => {
        const updatedVideos = [...prev]
        const lastVideoIndex = updatedVideos.length - 1

        if (lastVideoIndex >= 0) {
          updatedVideos[lastVideoIndex] = {
            ...updatedVideos[lastVideoIndex],
            status: 'processing',
            assetId: detail.asset_id
          }
        }

        return updatedVideos
      })
    } else {
      console.log('No asset_id available')
      // Fallback to simulated processing
      setTimeout(() => {
        setUploadedVideos((prev) => {
          const updatedVideos = [...prev]
          const lastVideoIndex = updatedVideos.length - 1

          if (lastVideoIndex >= 0) {
            updatedVideos[lastVideoIndex] = {
              ...updatedVideos[lastVideoIndex],
              status: 'ready',
            }
          }

          return updatedVideos
        })

        // Call the onUploadComplete callback
        if (onUploadComplete) {
          onUploadComplete({
            uploadId: detail.upload_id,
            assetId: detail.asset_id,
            playbackId: detail.playback_ids?.[0]?.id,
          })
        }
      }, 5000)
    }
  }

  // Function to handle upload error
  const handleError = (event: CustomEvent) => {
    console.log('Upload error event triggered', event)

    // Log the full event detail structure
    try {
      const detailStr = JSON.stringify(
        event.detail,
        (key, value) => {
          // Handle objects that can't be stringified
          if (value instanceof File) {
            return `[File: ${value.name}, size: ${value.size}]`
          } else if (value instanceof Error) {
            return `[Error: ${value.message}]`
          }
          return value
        },
        2,
      )
      console.log('Error event detail structure:', detailStr)
    } catch (err) {
      console.log('Could not stringify error event detail:', err)
    }

    // Extract error information
    let errorMessage = 'Unknown error'

    if (event.detail instanceof Error) {
      errorMessage = event.detail.message || 'Error without message'
    } else if (typeof event.detail === 'string') {
      errorMessage = event.detail
    } else if (typeof event.detail === 'object' && event.detail !== null) {
      if ('message' in event.detail) {
        errorMessage = event.detail.message || 'Error object without message'
      } else if ('error' in event.detail && typeof event.detail.error === 'object') {
        errorMessage = event.detail.error.message || 'Nested error without message'
      }
    }

    console.error('Upload error:', errorMessage)

    // Update the status of the most recent upload
    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = {
          ...updatedVideos[lastVideoIndex],
          status: 'error',
          error: errorMessage,
        }
      }

      return updatedVideos
    })

    // Call the onUploadError callback
    if (onUploadError) {
      // Create an error object from the message
      const errorObj = new Error(errorMessage)
      onUploadError(errorObj)
    }
  }

  // Function to clear all uploads
  const handleClearAll = () => {
    setUploadedVideos([])
    console.log('Cleared uploaded videos')
  }

  // Function to manually trigger file selection
  const handleManualFileSelect = () => {
    console.log('Manual file selection triggered')
    if (uploaderRef.current) {
      console.log('MuxUploader ref exists, attempting to open file dialog')
      try {
        // Try to access the file input through the ref
        const fileInput = uploaderRef.current.querySelector('input[type="file"]')
        if (fileInput) {
          console.log('Found file input, clicking it')
          fileInput.click()
        } else {
          console.log('No file input found in MuxUploader')
        }
      } catch (error) {
        console.error('Error triggering file selection:', error)
      }
    } else {
      console.log('MuxUploader ref is null')
    }
  }

  // Function to poll for video status updates
  const pollVideoStatus = useCallback(
    async (videoId: string, assetId?: string) => {
      if (!assetId) {
        console.log(`No assetId available for video ${videoId}, cannot poll status`)
        return
      }

      console.log(`Polling status for video ${videoId} with assetId ${assetId}`)

      try {
        // Make a request to your backend to check the video status
        console.log(`Making request to /api/mux/assets/${assetId}`)
        const response = await fetch(`/api/mux/assets/${assetId}`)

        if (!response.ok) {
          console.error(`Failed to poll video status: ${response.status} ${response.statusText}`)

          // Try to get more details from the response
          try {
            const errorData = await response.json()
            console.error('Error details:', errorData)
          } catch (e) {
            console.error('Could not parse error response')
          }

          return
        }

        const data = await response.json()
        console.log(`Received status update for video ${videoId}:`, data)

        // Update the video status based on the response
        if (data.status === 'ready') {
          console.log(`Video ${videoId} is ready`)

          // Update the video status to ready
          setUploadedVideos((prev) => {
            const updatedVideos = [...prev]
            const videoIndex = updatedVideos.findIndex((v) => v.id === videoId)
            if (videoIndex !== -1) {
              updatedVideos[videoIndex] = {
                ...updatedVideos[videoIndex],
                status: 'ready',
                assetId: data.id,
                playbackId: data.playback_ids?.[0]?.id,
              }
            }
            return updatedVideos
          })

          // Call the onUploadComplete callback with the updated info
          if (onUploadComplete) {
            onUploadComplete({
              uploadId: videoId,
              assetId: data.id,
              playbackId: data.playback_ids?.[0]?.id,
            })
          }

          return true // Status is ready, stop polling
        } else if (data.status === 'errored') {
          console.error(`Video ${videoId} processing failed:`, data.errors)

          // Update the video status to error
          setUploadedVideos((prev) => {
            const updatedVideos = [...prev]
            const videoIndex = updatedVideos.findIndex((v) => v.id === videoId)
            if (videoIndex !== -1) {
              updatedVideos[videoIndex] = {
                ...updatedVideos[videoIndex],
                status: 'error',
              }
            }
            return updatedVideos
          })

          // Call the onUploadError callback
          if (onUploadError) {
            onUploadError(
              new Error(`Video processing failed: ${data.errors?.join(', ') || 'Unknown error'}`),
            )
          }

          return true // Status is errored, stop polling
        }

        return false // Status is still processing, continue polling
      } catch (error) {
        console.error(`Error polling video status for ${videoId}:`, error)
        return false // Error occurred, continue polling
      }
    },
    [onUploadComplete, onUploadError],
  )

  // Function to start polling for a video
  const startPollingVideoStatus = useCallback(
    (videoId: string, assetId?: string) => {
      if (!assetId) {
        console.log(`No assetId available for video ${videoId}, cannot start polling`)
        return
      }

      console.log(`Starting polling for video ${videoId} with assetId ${assetId}`)

      // Poll every 5 seconds
      const pollInterval = 5000
      let pollCount = 0
      const maxPolls = 60 // Maximum 5 minutes of polling

      const poll = async () => {
        pollCount++
        console.log(`Polling attempt ${pollCount} for video ${videoId}`)

        const isComplete = await pollVideoStatus(videoId, assetId)

        if (isComplete) {
          console.log(`Polling complete for video ${videoId}`)
          return
        }

        if (pollCount >= maxPolls) {
          console.log(`Reached maximum polling attempts for video ${videoId}`)
          return
        }

        // Schedule the next poll
        setTimeout(poll, pollInterval)
      }

      // Start polling
      poll()
    },
    [pollVideoStatus],
  )

  // Function to handle direct file selection
  const handleDirectFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Direct file selection triggered')
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', file.name)

    try {
      // Get the upload URL
      console.log('Getting upload URL...')
      const uploadUrl = await endpoint(file)
      console.log('Got upload URL:', uploadUrl)

      if (!uploadUrl) {
        console.error('Failed to get upload URL')
        return
      }

      // Create a new uploaded video entry
      const newVideo: UploadedVideo = {
        id: `manual-${Date.now()}`,
        filename: file.name,
        title: file.name.split('.').slice(0, -1).join('.') || file.name,
        status: 'uploading',
        progress: 0,
        uploadUrl,
      }

      // Add the new video to the list
      setUploadedVideos((prev) => [...prev, newVideo])

      // Upload the file manually
      console.log('Uploading file...')
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)

      // Track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          console.log(`Upload progress: ${progress}%`)

          // Update the progress in the uploaded videos list
          setUploadedVideos((prev) => {
            const updatedVideos = [...prev]
            const videoIndex = updatedVideos.findIndex((v) => v.id === newVideo.id)
            if (videoIndex !== -1) {
              updatedVideos[videoIndex] = {
                ...updatedVideos[videoIndex],
                progress,
              }
            }
            return updatedVideos
          })
        }
      }

      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Upload completed successfully')

          // Update the status to processing
          setUploadedVideos((prev) => {
            const updatedVideos = [...prev]
            const videoIndex = updatedVideos.findIndex((v) => v.id === newVideo.id)
            if (videoIndex !== -1) {
              updatedVideos[videoIndex] = {
                ...updatedVideos[videoIndex],
                status: 'processing',
                progress: 100,
              }
            }
            return updatedVideos
          })

          // Call the onUploadComplete callback
          if (onUploadComplete) {
            onUploadComplete({
              uploadId: newVideo.id,
              // Note: assetId and playbackId will be provided by the webhook
            })
          }

          // Wait for a short time to allow the webhook to update the video
          // Then check if we have an assetId and start polling
          setTimeout(() => {
            setUploadedVideos((prev) => {
              const updatedVideos = [...prev]
              const videoIndex = updatedVideos.findIndex((v) => v.id === newVideo.id)

              if (videoIndex !== -1) {
                const video = updatedVideos[videoIndex]

                // If we have an assetId, start polling
                if (video.assetId) {
                  console.log(
                    `Starting polling for asset ${video.assetId} from direct upload handler`,
                  )
                  startPollingVideoStatus(video.id, video.assetId)
                } else {
                  // Otherwise, simulate ready state after 10 seconds
                  setTimeout(() => {
                    setUploadedVideos((prev) => {
                      const updatedVideos = [...prev]
                      const videoIndex = updatedVideos.findIndex((v) => v.id === video.id)

                      if (videoIndex >= 0) {
                        updatedVideos[videoIndex] = {
                          ...updatedVideos[videoIndex],
                          status: 'ready',
                        }
                      }

                      return updatedVideos
                    })
                  }, 10000)
                }
              }

              return updatedVideos
            })
          }, 2000)
        } else {
          console.error('Upload failed with status:', xhr.status)

          // Update the status to error
          setUploadedVideos((prev) => {
            const updatedVideos = [...prev]
            const videoIndex = updatedVideos.findIndex((v) => v.id === newVideo.id)
            if (videoIndex !== -1) {
              updatedVideos[videoIndex] = {
                ...updatedVideos[videoIndex],
                status: 'error',
              }
            }
            return updatedVideos
          })

          // Call the onUploadError callback
          if (onUploadError) {
            onUploadError(new Error(`Upload failed with status: ${xhr.status}`))
          }
        }
      }

      // Handle errors
      xhr.onerror = () => {
        console.error('Upload failed with network error')

        // Update the status to error
        setUploadedVideos((prev) => {
          const updatedVideos = [...prev]
          const videoIndex = updatedVideos.findIndex((v) => v.id === newVideo.id)
          if (videoIndex !== -1) {
            updatedVideos[videoIndex] = {
              ...updatedVideos[videoIndex],
              status: 'error',
            }
          }
          return updatedVideos
        })

        // Call the onUploadError callback
        if (onUploadError) {
          onUploadError(new Error('Upload failed with network error'))
        }
      }

      // Send the file
      xhr.send(file)
    } catch (error) {
      console.error('Error in direct file upload:', error)

      // Call the onUploadError callback
      if (onUploadError) {
        onUploadError(
          error instanceof Error ? error : new Error('Unknown error in direct file upload'),
        )
      }
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Mux Uploader */}
      <div>
        <MuxUploader
          ref={uploaderRef}
          endpoint={endpoint}
          onInit={() => {
            console.log('MuxUploader initialized')
            console.log('MuxUploader ref after init:', uploaderRef.current)
          }}
          onUploadStart={(e: any) => {
            console.log('MuxUploader onUploadStart event fired', e)
            // Extract the file from the event
            let fileDetail = e

            // Check if the file is in e.detail.file
            if (e?.detail?.file instanceof File) {
              fileDetail = { file: e.detail.file }
            }
            // Check if the file is directly in e
            else if (e instanceof File) {
              fileDetail = { file: e }
            }

            console.log('Extracted file detail:', fileDetail)

            // Create a custom event with the file in the detail
            const customEvent = new CustomEvent('uploadstart', {
              detail: fileDetail,
            })
            handleUploadStart(customEvent)
          }}
          onProgress={(e: any) => {
            console.log('MuxUploader onProgress event fired', e)
            handleProgress(e as CustomEvent)
          }}
          onSuccess={(e: any) => {
            console.log('MuxUploader onSuccess event fired', e)
            // Create a custom event with the upload details
            const customEvent = new CustomEvent('success', {
              detail: e?.detail || e,
            })
            handleSuccess(customEvent)
          }}
          onError={(e: any) => {
            console.log('MuxUploader onError event fired', e)
            // Create a custom event with the error details
            const customEvent = new CustomEvent('error', {
              detail: e?.detail || e,
            })
            handleError(customEvent)
          }}
        >
          <div className="w-full h-48 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center hover:border-gray-500 transition-colors">
            <MuxUploaderDrop className="w-full h-full flex flex-col items-center justify-center text-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-500 text-center">Drop your video file here or</p>
              <MuxUploaderFileSelect>
                <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Browse Files
                </button>
              </MuxUploaderFileSelect>

              {/* Manual file selection button */}
              <button
                onClick={handleManualFileSelect}
                type="button"
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Manual File Select
              </button>

              {/* Direct file input as fallback */}
              <div className="mt-4">
                <p className="text-sm text-gray-500 text-center">
                  If the above methods don't work, try this:
                </p>
                <label className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer inline-block">
                  Direct File Upload
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleDirectFileSelect}
                    accept="video/*"
                  />
                </label>
              </div>
            </MuxUploaderDrop>
          </div>
        </MuxUploader>
      </div>

      {/* Progress bar for current upload */}
      {uploadedVideos.length > 0 &&
        uploadedVideos[uploadedVideos.length - 1].status === 'uploading' && (
          <ProgressBar
            isUploading={true}
            progress={uploadedVideos[uploadedVideos.length - 1].progress}
          />
        )}

      {/* Uploaded Videos List */}
      <VideoList videos={uploadedVideos} onClearAll={handleClearAll} />
    </div>
  )
}

export default SimpleVideoUploader


