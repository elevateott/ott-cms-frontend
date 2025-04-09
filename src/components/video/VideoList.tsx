'use client'

/**
 * VideoList Component
 *
 * An enhanced component for displaying a list of videos
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import VideoGrid from './VideoGrid'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/utilities/eventBus'
import { API_ENDPOINTS } from '@/constants'

export interface VideoListProps extends React.HTMLAttributes<HTMLDivElement> {
  refreshTrigger?: number
  limit?: number
  sort?: string
  showRefreshButton?: boolean
}

export const VideoList: React.FC<VideoListProps> = ({
  className,
  refreshTrigger = 0,
  limit = 10,
  sort = '-createdAt',
  showRefreshButton = true,
  ...props
}) => {
  const router = useRouter()
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch videos from the API
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_ENDPOINTS.VIDEOS}?limit=${limit}&sort=${sort}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.data?.docs) {
        setVideos(data.data.docs)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [limit, sort])

  // Fetch videos when the component mounts or refreshTrigger changes
  useEffect(() => {
    fetchVideos()
  }, [fetchVideos, refreshTrigger])

  // Listen for video created events from the event bus
  useEventBusOn(
    EVENTS.VIDEO_CREATED,
    (data) => {
      console.log('Video created event received:', data)
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        fetchVideos()
      }, 500)
    },
    [fetchVideos],
  )

  // Listen for video updated events from the event bus
  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    (data) => {
      console.log('Video updated event received:', data)
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        fetchVideos()
      }, 500)
    },
    [fetchVideos],
  )

  // Handle view button click
  const handleView = useCallback(
    (id: string) => {
      router.push(`/admin/videos/${id}`)
    },
    [router],
  )

  // Handle edit button click
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/videos/${id}/edit`)
    },
    [router],
  )

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    fetchVideos()
  }, [fetchVideos])

  return (
    <div className={cn('', className)} {...props}>
      {/* Header with refresh button */}
      {showRefreshButton && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Videos</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            }
          >
            Refresh
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && videos.length === 0 && (
        <div className="p-8 text-center text-gray-500">Loading videos...</div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-medium">Error loading videos</p>
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      )}

      {/* Videos grid */}
      {!loading && !error && (
        <VideoGrid
          videos={videos.map((video) => ({
            id: video.id,
            title: video.title,
            status: video.muxData?.status,
            playbackId: video.muxData?.playbackId,
            thumbnailUrl: video.muxThumbnailUrl,
            duration: video.duration,
            createdAt: video.createdAt,
          }))}
          onView={handleView}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}

export default VideoList
