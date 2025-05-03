'use client'

import { clientLogger } from '@/utils/clientLogger'

import React, { useState, useRef, useEffect } from 'react'
import { EVENTS } from '@/constants/events'
import { eventBus } from '@/utilities/eventBus'
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
  // Track polling interval
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const forceRefresh = (source?: string): void => {
    clientLogger.info(
      `[ListViewRefresher] forceRefresh called${source ? ` from ${source}` : ''}`,
      'components/ListViewRefresher',
    )
    router.refresh()
    setLastRefreshed(new Date())
    setRefreshCount((prev) => prev + 1)
  }

  // Start polling if not already polling
  const startPolling = () => {
    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        clientLogger.info(
          '[ListViewRefresher] Polling refresh (no pendingVideos check)',
          'components/ListViewRefresher',
        )
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
    // Also listen for the underscore version of the event (from utilities/eventBus.ts)
    'video_upload_completed',
    // Custom event for manual refresh
    'RELOAD_PAGE' as string,
  ]

  // Set up listeners for all relevant events in a useEffect
  useEffect(() => {
    // Create an array to store unsubscribe functions
    const unsubscribes: (() => void)[] = []

    // Set up event handlers
    refresherEvents.forEach((eventName) => {
      clientLogger.info(
        `[ListViewRefresher] Setting up listener for ${eventName}`,
        'components/ListViewRefresher',
      )

      const unsubscribe = eventBus.on(eventName, (data) => {
        clientLogger.info(
          `[ListViewRefresher] Received event ${eventName}`,
          'components/ListViewRefresher',
          { data },
        )

        if (eventName === EVENTS.VIDEO_CREATED) {
          startPolling()
          setTimeout(() => {
            forceRefresh('VIDEO_CREATED')
          }, 3000)
        } else if (eventName === EVENTS.VIDEO_UPLOAD_COMPLETED) {
          // Client-side event from uploader: just start polling, no delay or forceRefresh needed
          clientLogger.info(
            `[ListViewRefresher] Starting polling due to ${eventName}`,
            'components/ListViewRefresher',
          )
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

      unsubscribes.push(unsubscribe)
    })

    // Clean up all subscriptions when component unmounts
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [refresherEvents, startPolling, stopPolling, forceRefresh])

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
