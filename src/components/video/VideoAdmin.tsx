'use client'

/**
 * VideoAdmin Component
 *
 * An enhanced component for managing videos in the admin panel
 */

import React, { useState, useCallback } from 'react'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import VideoUploader from './VideoUploader'
import VideoList from './VideoList'
import { useEventBusEmit } from '@/hooks/useEventBus'
import { EVENTS } from '@/utilities/eventBus'

export interface VideoAdminProps extends React.HTMLAttributes<HTMLDivElement> {}

export const VideoAdmin: React.FC<VideoAdminProps> = ({ className, ...props }) => {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)
  const [showUploader, setShowUploader] = useState<boolean>(false)
  const emitEvent = useEventBusEmit()

  // Handle refresh list
  const handleRefreshList = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Handle upload complete
  const handleUploadComplete = useCallback(
    (data: any) => {
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

  // Toggle uploader visibility
  const toggleUploader = useCallback(() => {
    setShowUploader((prev) => !prev)
  }, [])

  return (
    <div
      className={cn('space-y-6 w-full max-w-full', className)}
      style={{ width: '100%', maxWidth: '100%' }}
      {...props}
    >
      {/* Header with upload button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Management</h1>
        <Button variant={showUploader ? 'outline' : 'default'} onClick={toggleUploader}>
          {showUploader ? 'Hide Uploader' : 'Upload New Video'}
        </Button>
      </div>

      {/* Video uploader */}
      {showUploader && (
        <VideoUploader
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          refreshList={handleRefreshList}
        />
      )}

      {/* Video list */}
      <VideoList refreshTrigger={refreshTrigger} showRefreshButton={true} />
    </div>
  )
}

export default VideoAdmin
