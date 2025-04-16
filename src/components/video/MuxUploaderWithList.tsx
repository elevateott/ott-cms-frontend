'use client'

import React, { useState, useRef } from 'react'
import MuxUploader from '@mux/mux-uploader-react'
import { MuxUploaderDrop, MuxUploaderFileSelect } from '@mux/mux-uploader-react'
import VideoUploadList, { UploadedVideo } from './VideoUploadList'
import { cn } from '@/utilities/ui'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

export interface MuxUploaderWithListProps {
  endpoint: (file?: File) => Promise<string>
  onUploadComplete?: (data: { uploadId?: string; assetId?: string; playbackId?: string }) => void
  onUploadError?: (error: Error) => void
  className?: string
}

const MuxUploaderWithList: React.FC<MuxUploaderWithListProps> = ({
  endpoint,
  onUploadComplete,
  onUploadError,
  className,
}) => {
  // Initialize with an empty array for uploaded videos
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([])
  // Use any type for the ref to avoid TypeScript errors with the custom element
  const uploaderRef = useRef<any>(null)

  // Listen for video_updated events
  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    (data) => {
      console.log('🔍 DEBUG [MuxUploaderWithList] VIDEO_UPDATED event received:', data)
      console.log('🔍 DEBUG [MuxUploaderWithList] Current uploadedVideos state:', uploadedVideos)
      console.log('🔍 DEBUG [MuxUploaderWithList] Event type:', EVENTS.VIDEO_UPDATED)

      // Check if this is a status change to ready
      if (data && data.isStatusChange) {
        console.log('🔍 DEBUG [MuxUploaderWithList] This is a status change to ready event')

        // Update any videos in our list that are in 'processing' status to 'ready'
        setUploadedVideos((prev) => {
          console.log(
            '🔍 DEBUG [MuxUploaderWithList] Current uploaded videos before update:',
            JSON.stringify(prev),
          )

          // Find any videos that are in processing status
          const hasProcessingVideos = prev.some((video) => video.status === 'processing')
          console.log('🔍 DEBUG [MuxUploaderWithList] Has processing videos:', hasProcessingVideos)

          if (!hasProcessingVideos) {
            console.log('🔍 DEBUG [MuxUploaderWithList] No processing videos found to update')
            return prev
          }

          // Update all processing videos to ready
          const updatedVideos = prev.map((video) => {
            if (video.status === 'processing') {
              console.log(
                `🔍 DEBUG [MuxUploaderWithList] Updating video ${video.filename} from processing to ready`,
              )
              return {
                ...video,
                status: 'ready',
                progress: 100,
              } as UploadedVideo
            }
            return video
          })

          console.log(
            '🔍 DEBUG [MuxUploaderWithList] Updated videos after status change:',
            JSON.stringify(updatedVideos),
          )
          return updatedVideos
        })
      } else {
        console.log('🔍 DEBUG [MuxUploaderWithList] Not a status change to ready event')
        console.log('🔍 DEBUG [MuxUploaderWithList] Data details:', JSON.stringify(data))
      }
    },
    [],
  )

  // Listen for video:status:ready events specifically
  useEventBusOn(
    'video:status:ready',
    (data) => {
      console.log('🔍 DEBUG [MuxUploaderWithList] video:status:ready event received:', data)
      console.log('🔍 DEBUG [MuxUploaderWithList] Current uploadedVideos state:', uploadedVideos)

      // Force update all processing videos to ready status
      console.log('🔍 DEBUG [MuxUploaderWithList] FORCE UPDATING ALL PROCESSING VIDEOS TO READY')

      // DIRECT APPROACH: Just set all processing videos to ready
      const updatedVideos = [...uploadedVideos].map((video) => {
        if (video.status === 'processing') {
          console.log(
            `🔍 DEBUG [MuxUploaderWithList] Directly updating video ${video.filename} from processing to ready`,
          )
          return {
            ...video,
            status: 'ready' as const,
            progress: 100,
          }
        }
        return video
      })

      console.log('🔍 DEBUG [MuxUploaderWithList] Setting uploadedVideos directly:', updatedVideos)
      setUploadedVideos(updatedVideos)
    },
    [],
  )

  // Also listen for video:status:updated events
  useEventBusOn(
    'video:status:updated',
    (data) => {
      console.log('🔍 DEBUG [MuxUploaderWithList] video:status:updated event received:', data)
      console.log('🔍 DEBUG [MuxUploaderWithList] Current uploadedVideos state:', uploadedVideos)

      // Force update all processing videos to ready status
      console.log('🔍 DEBUG [MuxUploaderWithList] FORCE UPDATING ALL PROCESSING VIDEOS TO READY')

      // DIRECT APPROACH: Just set all processing videos to ready
      const updatedVideos = [...uploadedVideos].map((video) => {
        if (video.status === 'processing') {
          console.log(
            `🔍 DEBUG [MuxUploaderWithList] Directly updating video ${video.filename} from processing to ready`,
          )
          return {
            ...video,
            status: 'ready' as const,
            progress: 100,
          }
        }
        return video
      })

      console.log('🔍 DEBUG [MuxUploaderWithList] Setting uploadedVideos directly:', updatedVideos)
      setUploadedVideos(updatedVideos)
    },
    [],
  )

  // Also listen for reload:page events
  useEventBusOn(
    'reload:page',
    (data) => {
      console.log('🔍 DEBUG [MuxUploaderWithList] reload:page event received:', data)
      console.log('🔍 DEBUG [MuxUploaderWithList] Current uploadedVideos state:', uploadedVideos)

      // Force update all processing videos to ready status
      console.log('🔍 DEBUG [MuxUploaderWithList] FORCE UPDATING ALL PROCESSING VIDEOS TO READY')

      // DIRECT APPROACH: Just set all processing videos to ready
      const updatedVideos = [...uploadedVideos].map((video) => {
        if (video.status === 'processing') {
          console.log(
            `🔍 DEBUG [MuxUploaderWithList] Directly updating video ${video.filename} from processing to ready`,
          )
          return {
            ...video,
            status: 'ready' as const,
            progress: 100,
          }
        }
        return video
      })

      console.log('🔍 DEBUG [MuxUploaderWithList] Setting uploadedVideos directly:', updatedVideos)
      setUploadedVideos(updatedVideos)
    },
    [],
  )

  // Listen for video_created events
  useEventBusOn(
    EVENTS.VIDEO_CREATED,
    (data) => {
      console.log('🔍 DEBUG [MuxUploaderWithList] VIDEO_CREATED event received:', data)
      console.log('🔍 DEBUG [MuxUploaderWithList] Current uploadedVideos state:', uploadedVideos)
      // We don't need to do anything here since we're tracking uploads from the client side
      // But we log it for debugging purposes
    },
    [],
  )

  // Function to handle upload start
  const handleUploadStart = (event: CustomEvent) => {
    console.log('🔍 DEBUG [MuxUploaderWithList] Upload start event:', event)
    const file = event.detail as File
    if (!file) {
      console.log('🔍 DEBUG [MuxUploaderWithList] No file in upload start event')
      return
    }
    console.log('🔍 DEBUG [MuxUploaderWithList] Upload started for file:', file.name)

    // Create a new uploaded video object
    const newVideo: UploadedVideo = {
      id: Date.now().toString(),
      filename: file.name,
      title: file.name.split('.').slice(0, -1).join('.'), // Remove extension
      status: 'uploading',
      progress: 0,
    }

    // Add the new video to the list
    setUploadedVideos((prev) => [...prev, newVideo])
  }

  // Function to handle upload progress
  const handleProgress = (event: CustomEvent) => {
    console.log('🔍 DEBUG [MuxUploaderWithList] Progress event:', event)
    const progress = event.detail as number
    console.log('🔍 DEBUG [MuxUploaderWithList] Upload progress:', progress * 100, '%')

    // Update the progress of the most recent upload
    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        const lastVideo = updatedVideos[lastVideoIndex]
        updatedVideos[lastVideoIndex] = {
          ...lastVideo,
          progress: progress * 100,
        } as UploadedVideo
      }

      return updatedVideos
    })
  }

  // Function to handle upload success
  const handleSuccess = (event: CustomEvent) => {
    console.log('🔍 DEBUG [MuxUploaderWithList] Success event:', event)
    const detail = event.detail as {
      upload_id?: string
      asset_id?: string
      playback_ids?: Array<{ id: string }>
    }

    if (!detail) {
      console.log('🔍 DEBUG [MuxUploaderWithList] No detail in success event')
      return
    }

    console.log('🔍 DEBUG [MuxUploaderWithList] Upload success with details:', detail)

    // Update the status of the most recent upload
    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        const lastVideo = updatedVideos[lastVideoIndex]
        updatedVideos[lastVideoIndex] = {
          ...lastVideo,
          status: 'processing',
          progress: 100,
          assetId: detail.asset_id,
          uploadId: detail.upload_id,
          playbackId: detail.playback_ids?.[0]?.id,
        } as UploadedVideo
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
  }

  // Function to handle upload error
  const handleError = (event: CustomEvent) => {
    console.log('🔍 DEBUG [MuxUploaderWithList] Error event:', event)
    const error = event.detail as Error
    console.log('🔍 DEBUG [MuxUploaderWithList] Upload error:', error?.message || 'Unknown error')

    // Update the status of the most recent upload
    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        const lastVideo = updatedVideos[lastVideoIndex]
        updatedVideos[lastVideoIndex] = {
          ...lastVideo,
          status: 'error',
          error: error?.message || 'Unknown error',
        } as UploadedVideo
      }

      return updatedVideos
    })

    // Call the onUploadError callback
    if (onUploadError) {
      onUploadError(error)
    }
  }

  // Function to clear all uploads
  const handleClearAll = () => {
    setUploadedVideos([])
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Mux Uploader */}
      {/* @ts-expect-error - MuxUploader has custom event types that TypeScript doesn't recognize */}
      <MuxUploader
        ref={uploaderRef}
        endpoint={endpoint}
        onUploadStart={handleUploadStart as any}
        onProgress={handleProgress as any}
        onSuccess={handleSuccess as any}
        onError={handleError as any}
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
          </MuxUploaderDrop>
        </div>
      </MuxUploader>

      {/* Progress bar for current upload */}
      {uploadedVideos.length > 0 &&
        (() => {
          const lastVideo = uploadedVideos[uploadedVideos.length - 1]
          if (lastVideo && lastVideo.status === 'uploading') {
            return (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                    style={{ width: `${lastVideo.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Uploading: {Math.round(lastVideo.progress)}%
                </p>
              </div>
            )
          }
          return null
        })()}

      {/* Uploaded Videos List */}
      {console.log(
        '🔍 DEBUG [MuxUploaderWithList] Rendering VideoUploadList with videos:',
        JSON.stringify(uploadedVideos),
      )}
      <VideoUploadList videos={uploadedVideos} onClearAll={handleClearAll} />
    </div>
  )
}

export default MuxUploaderWithList
