'use client'

import { clientLogger } from '@/utils/clientLogger';


import React, { useEffect, useCallback, useState } from 'react'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

interface Video {
  id: string
  title: string
  status: string
  [key: string]: any
}

const fetchVideosFromServer = async (): Promise<Video[]> => {
  try {
    const res = await fetch('/api/videos', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch videos')
    return await res.json()
  } catch (err) {
    clientLogger.error('Error fetching videos:', err, 'components/VideoList')
    return []
  }
}

const VideoList: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    const vids = await fetchVideosFromServer()
    setVideos(vids)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // Listen for all relevant events and refresh the list
  useEventBusOn(EVENTS.VIDEO_UPDATED, () => {
    setTimeout(fetchVideos, 1000)
  }, [fetchVideos])

  useEventBusOn('video:status:ready', () => {
    setTimeout(fetchVideos, 1000)
  }, [fetchVideos])

  useEventBusOn(EVENTS.REFRESH_LIST_VIEW, () => {
    setTimeout(fetchVideos, 1000)
  }, [fetchVideos])

  if (loading) {
    return <div>Loading videos...</div>
  }

  if (!videos.length) {
    return <div>No videos found.</div>
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Videos</h2>
      <ul className="divide-y divide-gray-200">
        {videos.map((video) => (
          <li key={video.id} className="py-4 flex justify-between items-center">
            <span>
              <span className="font-medium">{video.title}</span>
              <span className="ml-2 text-sm text-gray-1000">({video.status})</span>
            </span>
            {/* Add more video info/actions here if needed */}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default VideoList