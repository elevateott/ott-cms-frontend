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

const POLL_INTERVAL = 10000 // 10 seconds

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
        console.log('[ListViewRefresher] Polling refresh (no pendingVideos check)')
        forceRefresh('polling')
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

  // Unified event list (matches EventMonitor)
  const refresherEvents = [
    EVENTS.VIDEO_CREATED,
    EVENTS.VIDEO_UPDATED,
    EVENTS.VIDEO_STATUS_READY,
    EVENTS.VIDEO_STATUS_UPDATED,
    EVENTS.VIDEO_UPLOAD_STARTED,
    EVENTS.VIDEO_UPLOAD_PROGRESS,
    EVENTS.VIDEO_UPLOAD_COMPLETED,
    EVENTS.VIDEO_UPLOAD_ERROR,
    EVENTS.RELOAD_PAGE,
  ]

  // Set up listeners for all relevant events
  refresherEvents.forEach((eventName) => {
    useEventBusOn(eventName, (data) => {
      if (eventName === EVENTS.VIDEO_CREATED) {
        startPolling()
        setTimeout(() => {
          forceRefresh('VIDEO_CREATED')
        }, 3000)
      } else if (eventName === EVENTS.VIDEO_UPLOAD_COMPLETED) {
        // Client-side event from uploader: just start polling, no delay or forceRefresh needed
        startPolling()
      } else if (eventName === EVENTS.VIDEO_STATUS_READY) {
        stopPolling()
        forceRefresh(EVENTS.VIDEO_STATUS_READY)
      } else if (eventName === EVENTS.VIDEO_UPDATED && data?.isStatusChange) {
        setTimeout(() => {
          forceRefresh('VIDEO_UPDATED')
        }, 3000)
      } else {
        // For all other events, just refresh immediately
        forceRefresh(eventName)
      }
    })
  })

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
