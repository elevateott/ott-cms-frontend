'use client'

/**
 * VideoUploadProgress Component
 *
 * A component for displaying video upload progress
 */

import React from 'react'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'

export interface VideoUploadProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  progress: number
  status: 'uploading' | 'processing' | 'ready' | 'error'
  filename?: string
  error?: string
  onCancel?: () => void
}

export const VideoUploadProgress: React.FC<VideoUploadProgressProps> = ({
  className,
  progress,
  status,
  filename,
  error,
  onCancel,
  ...props
}) => {
  // Format progress as percentage
  const progressPercent = Math.min(100, Math.max(0, progress))
  const formattedProgress = `${Math.round(progressPercent)}%`

  // Determine status text
  let statusText = 'Uploading...'
  if (status === 'processing') statusText = 'Processing...'
  if (status === 'ready') statusText = 'Ready'
  if (status === 'error') statusText = 'Error'

  return (
    <div className={cn('p-4 bg-white border border-gray-200 rounded-lg', className)} {...props}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium truncate" title={filename}>
          {filename || 'Uploading video...'}
        </div>
        <div className="text-sm text-gray-500">{formattedProgress}</div>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            status === 'error' ? 'bg-red-500' : 'bg-blue-500',
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm">
          {status === 'error' ? (
            <span className="text-red-500">{error || 'Upload failed'}</span>
          ) : (
            <span>{statusText}</span>
          )}
        </div>

        {onCancel && status === 'uploading' && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

export default VideoUploadProgress
