'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

// Define the upload status type
type UploadStatus = 'uploading' | 'processing' | 'ready' | 'error'

// Define the uploaded video type
export interface UploadedVideo {
  id: string
  filename: string
  title: string
  status: UploadStatus
  progress: number
  error?: string
  assetId?: string
  uploadId?: string
  playbackId?: string
}

export interface VideoUploadListProps {
  videos: UploadedVideo[]
  onClearAll?: () => void
  className?: string
}

const VideoUploadList: React.FC<VideoUploadListProps> = ({ videos, onClearAll, className }) => {
  console.log('🔍 DEBUG [VideoUploadList] Received videos:', videos)
  console.log('🔍 DEBUG [VideoUploadList] Videos JSON:', JSON.stringify(videos))

  // Log the status of each video
  useEffect(() => {
    if (videos.length > 0) {
      console.log('🔍 DEBUG [VideoUploadList] Current video statuses:')
      videos.forEach((video) => {
        console.log(
          `🔍 DEBUG [VideoUploadList] Video ${video.id} (${video.filename}): ${video.status}`,
        )
      })
    }
  }, [videos])

  if (videos.length === 0) {
    console.log('🔍 DEBUG [VideoUploadList] No videos to display')
    return null
  }

  return (
    <div className={cn('mt-4 border rounded-lg overflow-hidden', className)}>
      <div className="p-4 bg-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-medium">Uploaded Videos</h3>
        {onClearAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-xs flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </Button>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {videos.map((video) => (
          <div key={video.id} className="p-4 flex items-center justify-between">
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

export default VideoUploadList
