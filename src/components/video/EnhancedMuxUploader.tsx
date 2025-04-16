'use client'

import React, { useState, useRef, useEffect } from 'react'
import MuxUploader from '@mux/mux-uploader-react'
import {
  MuxUploaderDrop,
  MuxUploaderFileSelect,
  MuxUploaderProgress,
} from '@mux/mux-uploader-react'
import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

// Define the upload status type
type UploadStatus = 'uploading' | 'uploaded' | 'error'

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
}

export interface EnhancedMuxUploaderProps {
  endpoint: (file?: File) => Promise<string>
  onUploadComplete?: (data: { uploadId?: string; assetId?: string; playbackId?: string }) => void
  onUploadError?: (error: Error) => void
  className?: string
}

const EnhancedMuxUploader: React.FC<EnhancedMuxUploaderProps> = ({
  endpoint,
  onUploadComplete,
  onUploadError,
  className,
}) => {
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([])
  const uploaderRef = useRef<any>(null)

  // Function to handle upload start
  const handleUploadStart = (event: CustomEvent) => {
    const file = event.detail as File
    if (!file) return

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
    const progress = event.detail as number

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
    const detail = event.detail as {
      upload_id?: string
      asset_id?: string
      playback_ids?: Array<{ id: string }>
    }

    if (!detail) return

    // Update the status of the most recent upload
    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = {
          ...updatedVideos[lastVideoIndex],
          status: 'uploaded',
          progress: 100,
          assetId: detail.asset_id,
          playbackId: detail.playback_ids?.[0]?.id,
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
  }

  // Function to handle upload error
  const handleError = (event: CustomEvent) => {
    const error = event.detail as Error

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
      {/* Custom Mux Uploader */}
      <div className="w-full">
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
                <p className="text-sm text-gray-300 text-center">Drop your video file here or</p>
                <MuxUploaderFileSelect>
                  <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Browse Files
                  </button>
                </MuxUploaderFileSelect>
              </MuxUploaderDrop>
            </div>
          </MuxUploader>
      </div>

      {/* Progress bar for current upload */}
      {uploadedVideos.length > 0 &&
        uploadedVideos[uploadedVideos.length - 1].status === 'uploading' && (
          <div className="p-4 bg-gray-900 mt-4 rounded-lg">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${uploadedVideos[uploadedVideos.length - 1].progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-300 mt-1 text-center">
              Uploading: {Math.round(uploadedVideos[uploadedVideos.length - 1].progress)}%
            </p>
          </div>
        )}
      </div>

      {/* Uploaded Videos List */}
      {uploadedVideos.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-100 dark:bg-gray-900 flex justify-between items-center">
            <h3 className="text-lg font-medium">Uploaded Videos</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </Button>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {uploadedVideos.map((video) => (
              <div key={video.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  {video.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {video.status === 'uploaded' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
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
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                      Uploading
                    </span>
                  )}
                  {video.status === 'uploaded' && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
                      Uploaded
                    </span>
                  )}
                  {video.status === 'error' && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full">
                      Error
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedMuxUploader
