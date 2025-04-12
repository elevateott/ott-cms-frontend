'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/utilities/eventBus'

type Video = {
  id: string
  title: string
  muxData?: {
    status?: string
    playbackId?: string
  }
  thumbnail?: {
    url?: string
  }
  muxThumbnailUrl?: string
  createdAt: string
}

type VideoListProps = {
  refreshTrigger: number
}

const VideoList: React.FC<VideoListProps> = ({ refreshTrigger }) => {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Function to fetch videos
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/videos?sort=-createdAt&limit=10')

      if (!res.ok) {
        throw new Error('Failed to fetch videos')
      }

      const data = await res.json()
      console.log('Fetched videos:', data) // Log the response for debugging
      setVideos(data.docs || [])
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError('Failed to load videos')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch and refresh when the refreshTrigger changes
  useEffect(() => {
    fetchVideos()
  }, [refreshTrigger])

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

  const handleEditVideo = (id: string) => {
    router.push(`/admin/collections/videos/${id}`)
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null

    const statusColors = {
      uploading: 'bg-blue-100 text-blue-800',
      processing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
    }

    const color = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'

    return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{status}</span>
  }

  if (loading) {
    return <div className="p-4">Loading videos...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  if (videos.length === 0) {
    return <div className="p-4">No videos found. Upload your first video above.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thumbnail
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {videos.map((video) => (
            <tr key={video.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                {video.thumbnail?.url ? (
                  <img
                    src={video.thumbnail.url}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                ) : video.muxThumbnailUrl ? (
                  <img
                    src={video.muxThumbnailUrl}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                ) : video.muxData?.playbackId ? (
                  <img
                    src={`https://image.mux.com/${video.muxData.playbackId}/thumbnail.jpg?width=200&height=120&fit_mode=preserve`}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                ) : (
                  <div className="w-32 h-20 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500">No thumbnail</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{video.title}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(video.muxData?.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {new Date(video.createdAt).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleEditVideo(video.id)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default VideoList
