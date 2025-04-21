'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEventBusMulti } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

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
  // Track polling interval
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const forceRefresh = (source?: string): void => {
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

  // Use useEventBusMulti to handle all events
  useEventBusMulti({
    [EVENTS.VIDEO_CREATED]: () => {
      startPolling()
      setTimeout(() => {
        forceRefresh('VIDEO_CREATED')
      }, 3000)
    },
    [EVENTS.VIDEO_UPLOAD_COMPLETED]: () => {
      startPolling()
    },
    [EVENTS.VIDEO_STATUS_READY]: () => {
      stopPolling()
      forceRefresh(EVENTS.VIDEO_STATUS_READY)
    },
    [EVENTS.VIDEO_UPDATED]: (data) => {
      if (data?.isStatusChange) {
        setTimeout(() => {
          forceRefresh('VIDEO_UPDATED')
        }, 3000)
      } else {
        forceRefresh(EVENTS.VIDEO_UPDATED)
      }
    },
    [EVENTS.VIDEO_STATUS_UPDATED]: () => {
      forceRefresh(EVENTS.VIDEO_STATUS_UPDATED)
    },
    [EVENTS.VIDEO_UPLOAD_STARTED]: () => {
      forceRefresh(EVENTS.VIDEO_UPLOAD_STARTED)
    },
    [EVENTS.VIDEO_UPLOAD_PROGRESS]: () => {
      forceRefresh(EVENTS.VIDEO_UPLOAD_PROGRESS)
    },
    [EVENTS.VIDEO_UPLOAD_ERROR]: () => {
      forceRefresh(EVENTS.VIDEO_UPLOAD_ERROR)
    },
    RELOAD_PAGE: () => {
      forceRefresh('RELOAD_PAGE')
    },
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
