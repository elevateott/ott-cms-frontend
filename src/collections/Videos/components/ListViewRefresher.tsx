'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'
import { useRouter } from 'next/navigation'

/**
 * ListViewRefresher
 *
 * This component is specifically designed to refresh the Payload CMS list view
 * when videos are created or updated. It listens for events and triggers a refresh
 * of the list view without reloading the entire page.
 */
const POLL_INTERVAL = 5000 // 5 seconds

const ListViewRefresher: React.FC = () => {
  const router = useRouter()
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const pendingVideosRef = useRef<Set<string>>(new Set())
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const forceRefresh = (source?: string, data?: Record<string, unknown>): void => {
    console.log(`[ListViewRefresher] forceRefresh called${source ? ` from ${source}` : ''}`)
    router.refresh()
    setLastRefreshed(new Date())
    setRefreshCount((prev) => prev + 1)
  }

  // Start polling if not already polling
  const startPolling = () => {
    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        if (pendingVideosRef.current.size > 0) {
          console.log(
            '[ListViewRefresher] Polling refresh for pending videos:',
            Array.from(pendingVideosRef.current),
          )
          forceRefresh('polling')
        }
      }, POLL_INTERVAL)
    }
  }

  // Stop polling if no videos are pending
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // Listen for video created events
  useEventBusOn(EVENTS.VIDEO_CREATED, (data) => {
    const videoId = data?.id
    console.log('[ListViewRefresher] Received event: VIDEO_CREATED', data)
    if (videoId) {
      pendingVideosRef.current.add(videoId)
      startPolling()
    }
    setTimeout(() => {
      forceRefresh('VIDEO_CREATED', data)
    }, 3000)
  })

  // Listen for video ready events
  useEventBusOn(EVENTS.VIDEO_STATUS_READY, (data) => {
    const videoId = data?.id
    console.log('[ListViewRefresher] Received event: video:status:ready', data)
    if (videoId) {
      pendingVideosRef.current.delete(videoId)
      if (pendingVideosRef.current.size === 0) {
        stopPolling()
      }
    }
    forceRefresh(EVENTS.VIDEO_STATUS_READY, data)
  })
  // useEventBusOn('video_updated', (data) => {
  //   console.log('[ListViewRefresher] Received event: video_updated', data)
  //   if (data?.isStatusChange) {
  //     forceRefresh('video_updated', data)
  //   }
  // })
  useEventBusOn(EVENTS.VIDEO_UPDATED, (data) => {
    console.log('[ListViewRefresher] Received event: VIDEO_UPDATED', data)
    if (data?.isStatusChange) {
      setTimeout(() => {
        forceRefresh('VIDEO_UPDATED', data)
      }, 3000)
    }
  })
  useEventBusOn(EVENTS.REFRESH_LIST_VIEW, (data) => {
    console.log('[ListViewRefresher] Received event: REFRESH_LIST_VIEW', data)
    forceRefresh('REFRESH_LIST_VIEW', data)
  })

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 p-2 rounded-md shadow-md z-50 text-xs">
      <div className="font-medium text-green-800">List View Refresher Active</div>
      {lastRefreshed && (
        <div className="text-green-600">Last refreshed: {lastRefreshed.toLocaleTimeString()}</div>
      )}
      <div className="text-green-600">Events: {refreshCount}</div>
      <div className="text-green-600">Auto-refresh on status changes</div>
      <button
        onClick={() => forceRefresh('manual-refresh')}
        className="mt-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Refresh Now
      </button>
    </div>
  )
}

export default ListViewRefresher
