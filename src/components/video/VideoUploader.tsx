'use client'

/**
 * VideoUploader Component
 *
 * An enhanced component for uploading videos to Mux
 */

import React, { useState, useCallback, useRef } from 'react'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import VideoUploadProgress from './VideoUploadProgress'
import { useVideoUpload } from '@/hooks/useVideoUpload'
import { useEventBusEmit } from '@/hooks/useEventBus'
import { EVENTS } from '@/utilities/eventBus'

export interface VideoUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onUploadComplete?: (data: any) => void
  onUploadError?: (error: Error) => void
  refreshList?: () => void
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  className,
  onUploadComplete,
  onUploadError,
  refreshList,
  ...props
}) => {
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emitEvent = useEventBusEmit()

  // Set up the video upload hook
  const { isUploading, progress, error, uploadStatus, upload, cancelUpload, reset } =
    useVideoUpload({
      onSuccess: (data) => {
        if (onUploadComplete) {
          onUploadComplete(data)
        }

        // Show a success notification
        emitEvent(EVENTS.NOTIFICATION, {
          type: 'success',
          title: 'Upload Complete',
          message: 'Video has been uploaded and is now processing.',
        })

        // Refresh the video list if needed
        if (refreshList) {
          refreshList()
        }
      },
      onError: (err) => {
        if (onUploadError) {
          onUploadError(err)
        }

        // Show an error notification
        emitEvent(EVENTS.NOTIFICATION, {
          type: 'error',
          title: 'Upload Failed',
          message: err.message,
        })
      },
    })

  // Handle file selection
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }, [])

  // Handle file drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const droppedFile = event.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
    }
  }, [])

  // Handle drag events
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  // Handle upload button click
  const handleUpload = useCallback(async () => {
    if (file) {
      await upload(file)
    }
  }, [file, upload])

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    cancelUpload()
    setFile(null)
  }, [cancelUpload])

  // Handle reset button click
  const handleReset = useCallback(() => {
    reset()
    setFile(null)

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [reset])

  return (
    <div className={cn('', className)} {...props}>
      <Card variant="bordered" className="p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Video</h2>

        {/* File selection area */}
        {!file && !isUploading && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="hidden"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop a video file here, or click to select a file
            </p>
            <p className="mt-1 text-xs text-gray-500">Supported formats: MP4, MOV, AVI, etc.</p>
          </div>
        )}

        {/* Selected file info */}
        {file && !isUploading && (
          <div className="mt-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="text-sm text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleUpload}>
                Upload
              </Button>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <VideoUploadProgress
            progress={progress}
            status={uploadStatus}
            filename={file?.name}
            error={error?.message}
            onCancel={handleCancel}
          />
        )}

        {/* Upload complete or error */}
        {!isUploading && uploadStatus !== 'idle' && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleReset}>
              Upload Another Video
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default VideoUploader
