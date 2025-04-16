'use client'

import React, { useState, useRef, useEffect } from 'react'
import MuxUploader from '@mux/mux-uploader-react'
import { MuxUploaderDrop, MuxUploaderFileSelect } from '@mux/mux-uploader-react'
import VideoUploadList, { UploadedVideo } from './VideoUploadList'
import { cn } from '@/utilities/ui'

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
  // Initialize with test data to verify the list is visible
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([
    {
      id: '1',
      filename: 'test-video.mp4',
      title: 'test-video',
      status: 'uploading',
      progress: 45,
    },
    {
      id: '2',
      filename: 'completed-video.mp4',
      title: 'completed-video',
      status: 'processing',
      progress: 100,
      assetId: 'test-asset-id',
      playbackId: 'test-playback-id',
    },
    {
      id: '3',
      filename: 'ready-video.mp4',
      title: 'ready-video',
      status: 'ready',
      progress: 100,
      assetId: 'ready-asset-id',
      playbackId: 'ready-playback-id',
    },
    {
      id: '4',
      filename: 'error-video.mp4',
      title: 'error-video',
      status: 'error',
      progress: 0,
      error: 'Upload failed',
    },
  ])
  const uploaderRef = useRef<any>(null)

  // Function to handle upload start
  const handleUploadStart = (event: CustomEvent) => {
    console.log('Upload start event:', event)
    const file = event.detail as File
    if (!file) {
      console.log('No file in upload start event')
      return
    }
    console.log('Upload started for file:', file.name)

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
    console.log('Progress event:', event)
    const progress = event.detail as number
    console.log('Upload progress:', progress * 100, '%')

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
    console.log('Success event:', event)
    const detail = event.detail as {
      upload_id?: string
      asset_id?: string
      playback_ids?: Array<{ id: string }>
    }

    if (!detail) {
      console.log('No detail in success event')
      return
    }

    console.log('Upload success with details:', detail)

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

    // Simulate video processing and then mark as ready
    const videoId = detail.asset_id || Date.now().toString()

    // Simulate processing time (3 seconds)
    setTimeout(() => {
      setUploadedVideos((prev) => {
        const updatedVideos = [...prev]
        const videoIndex = updatedVideos.findIndex((v) => v.assetId === videoId)

        if (videoIndex >= 0) {
          updatedVideos[videoIndex] = {
            ...updatedVideos[videoIndex],
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
    }, 3000)
  }

  // Function to handle upload error
  const handleError = (event: CustomEvent) => {
    console.log('Error event:', event)
    const error = event.detail as Error
    console.log('Upload error:', error?.message || 'Unknown error')

    // Update the status of the most recent upload
    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = {
          ...updatedVideos[lastVideoIndex],
          status: 'error',
          error: error?.message || 'Unknown error',
        }
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
        uploadedVideos[uploadedVideos.length - 1].status === 'uploading' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${uploadedVideos[uploadedVideos.length - 1].progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Uploading: {Math.round(uploadedVideos[uploadedVideos.length - 1].progress)}%
            </p>
          </div>
        )}

      {/* Uploaded Videos List */}
      {console.log('Rendering VideoUploadList with videos:', uploadedVideos)}
      <VideoUploadList videos={uploadedVideos} onClearAll={handleClearAll} />
    </div>
  )
}

export default MuxUploaderWithList
