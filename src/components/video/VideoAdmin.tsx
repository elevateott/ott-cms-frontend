'use client'

/**
 * VideoAdmin Component
 *
 * An enhanced component for managing videos in the admin panel
 */

import React, { useState, useCallback } from 'react'
import { cn } from '@/utilities/ui'
import VideoUploader from './VideoUploaderNew'
import { useEventBusEmit } from '@/hooks/useEventBus'
import { EVENTS } from '@/utilities/eventBus'

export type VideoAdminProps = React.HTMLAttributes<HTMLDivElement>

export const VideoAdmin: React.FC<VideoAdminProps> = ({ className, ...props }) => {
  const [_refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const emitEvent = useEventBusEmit()

  // Handle refresh list
  const handleRefreshList = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Handle upload complete
  const handleUploadComplete = useCallback(
    (_data: Record<string, unknown>) => {
      // Refresh the video list
      handleRefreshList()

      // Show a success notification
      emitEvent(EVENTS.NOTIFICATION, {
        type: 'success',
        title: 'Upload Complete',
        message: 'Video has been uploaded and is now processing.',
      })
    },
    [handleRefreshList, emitEvent],
  )

  // Handle upload error
  const handleUploadError = useCallback(
    (error: Error) => {
      // Show an error notification
      emitEvent(EVENTS.NOTIFICATION, {
        type: 'error',
        title: 'Upload Failed',
        message: error.message,
      })
    },
    [emitEvent],
  )

  return (
    <div
      className={cn('space-y-6 w-full max-w-full', className)}
      style={{ width: '100%', maxWidth: '100%' }}
      {...props}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Management</h1>
      </div>

      {/* Video uploader - always visible */}
      <VideoUploader
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        refreshList={handleRefreshList}
      />

      {/* Video list */}
      {/* <VideoList refreshTrigger={refreshTrigger} showRefreshButton={true} /> */}
    </div>
  )
}

export default VideoAdmin
