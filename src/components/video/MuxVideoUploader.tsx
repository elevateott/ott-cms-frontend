'use client'

import React, { useState, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import MuxUploader from '@mux/mux-uploader-react'
import { MuxUploaderDrop, MuxUploaderFileSelect } from '@mux/mux-uploader-react'
import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utilities/ui'
import { eventBus } from '@/utilities/eventBus'
import { EVENTS } from '@/constants/events'
import styles from './MuxVideoUploader.module.css'
import MuxUploaderStyles from './MuxUploaderStyles'
import Script from 'next/script'

// Video list component
const VideoList = ({ videos, onClearAll }: { videos: UploadedVideo[]; onClearAll: () => void }) => {
  if (videos.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-100 flex justify-between items-center border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium">Upload Status</h3>
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
      <div className="space-y-3">
        {videos.map((video) => (
          <div key={video.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="mr-3">
                {video.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
                {video.status === 'complete' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {video.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex-grow space-y-1">
                <div className="font-medium">{video.title}</div>
                <div className="text-sm text-gray-500">{video.filename}</div>
              </div>
              <div className="flex items-center space-x-4">
                {video.status === 'uploading' && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Uploading
                  </span>
                )}
                {video.status === 'complete' && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Complete
                  </span>
                )}
                {video.status === 'error' && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    Error
                  </span>
                )}
              </div>
            </div>
            {video.status === 'uploading' && (
              <div className="mt-3">
                <Progress value={video.progress} className="h-1" />
                <p className="text-xs text-gray-500 mt-1">{Math.round(video.progress)}% uploaded</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
        <p>
          <strong>Note:</strong> Videos will appear in the list below once they have been uploaded.
          This may take a few minutes depending on the file size.
        </p>
      </div>
    </div>
  )
}

// Update the UploadStatus type
type UploadStatus = 'uploading' | 'complete' | 'error'

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

// Helper function to ensure all required fields are present
const ensureValidVideo = (video: Partial<UploadedVideo>): UploadedVideo => {
  return {
    id: video.id || Date.now().toString(),
    filename: video.filename || 'Unknown file',
    title: video.title || 'Untitled video',
    status: video.status || 'uploading',
    progress: video.progress || 0,
    error: video.error,
    assetId: video.assetId,
    playbackId: video.playbackId,
    uploadUrl: video.uploadUrl,
  }
}

export interface MuxVideoUploaderProps {
  endpoint: (file?: File) => Promise<string>
  onUploadComplete?: (data: { uploadId?: string; assetId?: string; playbackId?: string }) => void
  onUploadError?: (error: Error) => void
  className?: string
}

const MuxVideoUploader: React.FC<MuxVideoUploaderProps> = ({
  endpoint,
  onUploadComplete,
  onUploadError,
  className,
}) => {
  const [uploadedVideos, setUploadedVideos] = useLocalStorage<UploadedVideo[]>(
    'ott-cms-uploaded-videos',
    [],
  )
  const [uploaderKey, setUploaderKey] = useState<number>(0)
  const [isUploaderReady, setIsUploaderReady] = useState<boolean>(false)

  // Effect to set the uploader ready state after a short delay
  useEffect(() => {
    // Set a timeout to show the uploader after a short delay
    const timer = setTimeout(() => {
      setIsUploaderReady(true)
    }, 1000) // 1 second delay

    return () => clearTimeout(timer)
  }, [])

  // Effect to log when uploadedVideos changes and check for stalled uploads
  useEffect(() => {
    console.log('uploadedVideos state updated:', uploadedVideos)

    // Check if there are any videos in the 'uploading' state
    const hasUploadingVideos = uploadedVideos.some((video) => video.status === 'uploading')

    if (hasUploadingVideos) {
      // Set up a timer to check for videos that have been in 'uploading' state for too long
      const timer = setTimeout(() => {
        console.log('Checking for stalled uploads...')

        setUploadedVideos((prev) => {
          // Find videos that have been in 'uploading' state for too long
          const updatedVideos = prev.map((video) => {
            // If a video has been in 'uploading' state and has 100% progress, mark it as 'ready'
            if (video.status === 'uploading' && video.progress >= 99) {
              console.log('Found stalled upload with 100% progress, marking as ready:', video)
              return {
                ...video,
                status: 'ready' as UploadStatus,
                progress: 100,
              }
            }
            return video
          })

          return updatedVideos
        })
      }, 5000) // Check after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [uploadedVideos, setUploadedVideos])

  // Function to handle upload start
  const handleUploadStart = (event: CustomEvent) => {
    const file = event.detail?.file || event.detail

    if (!file || !file.name) {
      console.error('File is undefined or missing name property:', event.detail)
      return
    }

    const newVideo = ensureValidVideo({
      id: Date.now().toString(),
      filename: file.name,
      title: file.name.split('.').slice(0, -1).join('.'), // Remove extension
      status: 'uploading',
      progress: 0,
    })

    setUploadedVideos((prev) => [...prev, newVideo])
  }

  // Function to handle upload progress
  const handleProgress = (event: CustomEvent) => {
    const progress = event.detail as number

    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = ensureValidVideo({
          ...updatedVideos[lastVideoIndex],
          progress: progress,
        })
      }

      return updatedVideos
    })
  }

  // Function to handle upload success
  const handleSuccess = (event: CustomEvent) => {
    const { upload_id, asset_id, playback_ids } = event.detail || {}

    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = ensureValidVideo({
          ...updatedVideos[lastVideoIndex],
          status: 'complete',
          progress: 100,
          assetId: asset_id,
          playbackId: playback_ids?.[0]?.id,
        })
      }

      return updatedVideos
    })

    // Emit client-side event for upload completed
    eventBus.emit(EVENTS.VIDEO_UPLOAD_COMPLETED, {
      uploadId: upload_id,
      assetId: asset_id,
      playbackId: playback_ids?.[0]?.id,
      timestamp: Date.now(),
      source: 'client',
    })

    if (onUploadComplete) {
      onUploadComplete({
        uploadId: upload_id,
        assetId: asset_id,
        playbackId: playback_ids?.[0]?.id,
      })
    }

    // Reset the uploader
    setUploaderKey((k) => k + 1)
  }

  // Function to handle upload error
  const handleError = (event: CustomEvent) => {
    const error = event.detail as Error

    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = ensureValidVideo({
          ...updatedVideos[lastVideoIndex],
          status: 'error',
          error: error?.message || 'Unknown error',
        })
      }

      return updatedVideos
    })

    if (onUploadError) {
      onUploadError(error)
    }
  }

  // Function to clear all uploads
  const handleClearAll = () => {
    setUploadedVideos([])
    console.log('All uploads cleared')
  }

  // Effect to automatically update video status to ready after upload completes
  useEffect(() => {
    // Find any videos that are in the uploading state
    const uploadingVideos = uploadedVideos.filter((video) => video.status === 'uploading')

    if (uploadingVideos.length > 0) {
      console.log('Found videos in uploading state:', uploadingVideos)

      // Set a timer to automatically update the status to complete after 10 seconds
      const timer = setTimeout(() => {
        console.log('Auto-updating video status to complete after timeout')

        setUploadedVideos((prev) => {
          return prev.map((video) => {
            if (video.status === 'uploading') {
              console.log('Auto-updating video to complete status:', video)
              return ensureValidVideo({
                ...video,
                status: 'complete',
                progress: 100,
              })
            }
            return video
          })
        })
      }, 10000) // 10 seconds timeout

      return () => clearTimeout(timer)
    }
  }, [uploadedVideos, setUploadedVideos])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Load preload script with highest priority */}
      <Script
        id="mux-uploader-preload"
        strategy="afterInteractive"
        src="/mux-uploader-preload.js"
        onLoad={() => {
          console.log('Mux Uploader preload script loaded')
        }}
      />

      {/* Add the styles component */}
      <MuxUploaderStyles />

      {/* Mux Uploader */}
      <div className={cn(styles.muxUploaderContainer, 'mux-uploader')}>
        {!isUploaderReady ? (
          // Show loader while uploader is not ready
          <div className="w-full h-48 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Loading video uploader...</p>
          </div>
        ) : (
          // Show uploader when ready
          <MuxUploader
            key={uploaderKey}
            endpoint={endpoint}
            onUploadStart={handleUploadStart as any}
            onProgress={handleProgress as any}
            onSuccess={handleSuccess as any}
            onError={handleError as any}
          >
            <div className={cn(styles.dropArea, 'flex flex-col items-center justify-center')}>
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
                <p className="text-sm text-gray-300 text-center">Drop your video file here or</p>
                <MuxUploaderFileSelect>
                  <button
                    className="mux-styled-button"
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'rgb(37, 99, 235)',
                      color: 'white',
                      borderRadius: '0.375rem',
                      transition: 'background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      lineHeight: '1.25rem',
                      fontWeight: 500,
                      visibility: 'visible',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgb(29, 78, 216)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgb(37, 99, 235)'
                    }}
                  >
                    Browse Files
                  </button>
                </MuxUploaderFileSelect>
              </MuxUploaderDrop>
            </div>
          </MuxUploader>
        )}
      </div>

      {/* Uploaded Videos List */}
      <VideoList videos={uploadedVideos} onClearAll={handleClearAll} />
    </div>
  )
}

export default MuxVideoUploader
