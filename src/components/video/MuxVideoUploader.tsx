'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import MuxUploader from '@mux/mux-uploader-react'
import { MuxUploaderDrop, MuxUploaderFileSelect } from '@mux/mux-uploader-react'
import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/utilities/ui'

// Video list component
const VideoList = ({ videos, onClearAll }: { videos: UploadedVideo[]; onClearAll: () => void }) => {
  if (videos.length === 0) {
    return null
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-100 flex justify-between items-center">
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
  const uploaderRef = useRef<any>(null)

  // Function to handle upload start
  const handleUploadStart = (event: CustomEvent) => {
    console.log('Upload started:', event.detail)
    const file = event.detail?.file || event.detail

    if (!file || !file.name) {
      console.error('File is undefined or missing name property:', event.detail)
      return
    }

    const newVideo: UploadedVideo = {
      id: Date.now().toString(),
      filename: file.name,
      title: file.name.split('.').slice(0, -1).join('.'), // Remove extension
      status: 'uploading',
      progress: 0,
    }

    setUploadedVideos((prev) => [...prev, newVideo])
    console.log('New video added:', newVideo)
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
    if (!event.detail) {
      console.error('Success event detail is missing:', event.detail)
      return
    }

    console.log('Upload successful:', event.detail)
    const detail = event.detail as {
      upload_id?: string
      asset_id?: string
      playback_ids?: Array<{ id: string }>
    }

    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = {
          ...updatedVideos[lastVideoIndex],
          status: 'ready',
          progress: 100,
          assetId: detail.asset_id,
          playbackId: detail.playback_ids?.[0]?.id,
        }
        console.log('Video status updated to ready:', updatedVideos[lastVideoIndex])
      }

      return updatedVideos
    })

    if (onUploadComplete) {
      onUploadComplete({
        uploadId: detail.upload_id,
        assetId: detail.asset_id,
        playbackId: detail.playback_ids?.[0]?.id,
      })
    }

    setTimeout(() => {
      setUploaderKey((k) => k + 1)
      console.log('Uploader reset with new key:', uploaderKey + 1)
    }, 500)
  }

  // Function to handle upload error
  const handleError = (event: CustomEvent) => {
    console.error('Upload error:', event.detail)
    const error = event.detail as Error

    setUploadedVideos((prev) => {
      const updatedVideos = [...prev]
      const lastVideoIndex = updatedVideos.length - 1

      if (lastVideoIndex >= 0) {
        updatedVideos[lastVideoIndex] = {
          ...updatedVideos[lastVideoIndex],
          status: 'error',
          error: error?.message || 'Unknown error',
        }
        console.log('Video status updated to error:', updatedVideos[lastVideoIndex])
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Mux Uploader */}
      <div>
        <MuxUploader
          key={uploaderKey}
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

      {/* Uploaded Videos List */}
      <VideoList videos={uploadedVideos} onClearAll={handleClearAll} />
    </div>
  )
}

export default MuxVideoUploader
