'use client'

import { clientLogger } from '@/utils/clientLogger';


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
    clientLogger.info(`[ListViewRefresher] forceRefresh called${source ? ` from ${source}` : ''}`, 'components/ListViewRefresher')
    router.refresh()
    setLastRefreshed(new Date())
    setRefreshCount((prev) => prev + 1)
  }

  // Start polling if not already polling
  const startPolling = () => {
    // Only start polling if we don't already have a polling interval
    if (!pollingRef.current) {
      clientLogger.info('[ListViewRefresher] Starting polling interval', 'components/ListViewRefresher')

      // Set a maximum number of poll attempts to avoid excessive API calls
      let pollCount = 0
      const MAX_POLL_COUNT = 100 // Maximum number of times to poll

      pollingRef.current = setInterval(() => {
        pollCount++
        clientLogger.info(`[ListViewRefresher] Polling refresh ${pollCount}/${MAX_POLL_COUNT}`, 'components/ListViewRefresher')

        // If we've reached the maximum number of polls, stop polling
        if (pollCount >= MAX_POLL_COUNT) {
          clientLogger.info('[ListViewRefresher] Reached maximum poll count, stopping polling', 'components/ListViewRefresher')
          stopPolling()
          return
        }

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

  // Debounce refresh to prevent excessive calls
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastEventTimeRef = useRef<number>(0)
  const MIN_REFRESH_INTERVAL = 2000 // 2 seconds minimum between refreshes

  const debouncedRefresh = (source: string) => {
    const now = Date.now()
    const timeSinceLastEvent = now - lastEventTimeRef.current

    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }

    // If we've refreshed recently, set a timeout for the remaining time
    if (timeSinceLastEvent < MIN_REFRESH_INTERVAL) {
      const delay = MIN_REFRESH_INTERVAL - timeSinceLastEvent
      clientLogger.info(`[ListViewRefresher] Debouncing refresh from ${source} for ${delay}ms`, 'components/ListViewRefresher')
      refreshTimeoutRef.current = setTimeout(() => {
        forceRefresh(`${source} (debounced)`)
        lastEventTimeRef.current = Date.now()
      }, delay)
    } else {
      // Otherwise refresh immediately
      forceRefresh(source)
      lastEventTimeRef.current = now
    }
  }

  // Use useEventBusMulti to handle all events
  useEventBusMulti({
    [EVENTS.VIDEO_CREATED]: () => {
      startPolling()
      debouncedRefresh('VIDEO_CREATED')
    },
    [EVENTS.VIDEO_UPLOAD_COMPLETED]: () => {
      startPolling()
    },
    [EVENTS.VIDEO_STATUS_READY]: () => {
      stopPolling()
      debouncedRefresh(EVENTS.VIDEO_STATUS_READY)
    },
    [EVENTS.VIDEO_UPDATED]: (data) => {
      if (data?.isStatusChange) {
        debouncedRefresh('VIDEO_UPDATED')
      }
    },
    [EVENTS.VIDEO_STATUS_UPDATED]: () => {
      debouncedRefresh(EVENTS.VIDEO_STATUS_UPDATED)
    },
    [EVENTS.VIDEO_UPLOAD_STARTED]: () => {
      debouncedRefresh(EVENTS.VIDEO_UPLOAD_STARTED)
    },
    // Don't refresh on every progress event - it's too frequent
    // [EVENTS.VIDEO_UPLOAD_PROGRESS]: () => {
    //   debouncedRefresh(EVENTS.VIDEO_UPLOAD_PROGRESS)
    // },
    [EVENTS.VIDEO_UPLOAD_ERROR]: () => {
      debouncedRefresh(EVENTS.VIDEO_UPLOAD_ERROR)
    },
    RELOAD_PAGE: () => {
      debouncedRefresh('RELOAD_PAGE')
    },
  })

  useEffect(() => {
    return () => {
      stopPolling()
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
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
