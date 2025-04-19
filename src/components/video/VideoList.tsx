'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'

import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'
import { API_ROUTES } from '@/constants/api'
import SimpleVideoGrid from './SimpleVideoGrid'

interface Video {
  id: string
  title: string
  muxData?: {
    status?: string
    playbackId?: string
  }
  muxThumbnailUrl?: string
  duration?: number
  createdAt: string
}

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
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_ROUTES.VIDEOS}?sort=${sort}&limit=${limit}`)

      if (!res.ok) {
        throw new Error('Failed to fetch videos')
      }

      const response = await res.json()
      const videos = Array.isArray(response.data) ? response.data : response.data?.docs || []
      setVideos(videos)
      setError(null)
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [sort, limit])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos, refreshTrigger])

  useEventBusOn(
    EVENTS.VIDEO_CREATED,
    () => {
      setTimeout(fetchVideos, 500)
    },
    [fetchVideos],
  )

  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    () => {
      setTimeout(fetchVideos, 500)
    },
    [fetchVideos],
  )

  const handleView = useCallback(
    (id: string) => {
      router.push(`/admin/videos/${id}`)
    },
    [router],
  )

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/admin/videos/${id}/edit`)
    },
    [router],
  )

  const handleRefresh = useCallback(() => {
    fetchVideos()
  }, [fetchVideos])

  return (
    <div
      className={cn('space-y-6 w-full max-w-full', className)}
      style={{ width: '100%', maxWidth: '100%' }}
      {...props}
    >
      {showRefreshButton && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Videos</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
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
            Refresh
          </Button>
        </div>
      )}

      {loading && videos.length === 0 && (
        <div className="p-8 text-center text-gray-500">Loading videos...</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p className="font-medium">Error loading videos</p>
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && (
        <SimpleVideoGrid
          videos={videos.map((video) => ({
            id: video.id,
            title: video.title,
            status: video.muxData?.status,
            playbackId: video.muxData?.playbackId,
            thumbnailUrl:
              video.muxThumbnailUrl ||
              (video.muxData?.playbackId
                ? `https://image.mux.com/${video.muxData.playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=preserve`
                : undefined),
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
