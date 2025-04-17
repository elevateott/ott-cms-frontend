'use client'

import React, { useState } from 'react'
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
const ListViewRefresher: React.FC = () => {
  const router = useRouter()
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  // Helper to force a refresh using Next.js router
  const forceRefresh = (source?: string, data?: Record<string, unknown>): void => {
    console.log(`[ListViewRefresher] forceRefresh called${source ? ` from ${source}` : ''}`)
    router.refresh()
    setLastRefreshed(new Date())
    setRefreshCount((prev) => prev + 1)
  }

  useEventBusOn('video:status:ready', (data) => {
    console.log('[ListViewRefresher] Received event: video:status:ready', data)
    forceRefresh('video:status:ready', data)
  })
  useEventBusOn('video_updated', (data) => {
    console.log('[ListViewRefresher] Received event: video_updated', data)
    if (data?.isStatusChange) {
      forceRefresh('video_updated', data)
    }
  })
  useEventBusOn(EVENTS.VIDEO_CREATED, (data) => {
    console.log('[ListViewRefresher] Received event: VIDEO_CREATED', data)
    setTimeout(() => {
      forceRefresh('VIDEO_CREATED', data)
    }, 1000)
  })
  useEventBusOn(EVENTS.VIDEO_UPDATED, (data) => {
    console.log('[ListViewRefresher] Received event: VIDEO_UPDATED', data)
    if (data?.isStatusChange) {
      setTimeout(() => {
        forceRefresh('VIDEO_UPDATED', data)
      }, 1000)
    }
  })
  useEventBusOn(EVENTS.REFRESH_LIST_VIEW, (data) => {
    console.log('[ListViewRefresher] Received event: REFRESH_LIST_VIEW', data)
    forceRefresh('REFRESH_LIST_VIEW', data)
  })

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
