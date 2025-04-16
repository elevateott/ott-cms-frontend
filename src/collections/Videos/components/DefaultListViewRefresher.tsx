'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

/**
 * DefaultListViewRefresher
 *
 * This component listens for video_created and video_updated events
 * and refreshes the default Payload CMS list view when they occur.
 *
 * It's designed to be added to the beforeList array in the Videos collection config.
 */
const DefaultListViewRefresher: React.FC = () => {
  const router = useRouter()
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // Log when component is mounted
  useEffect(() => {
    console.log('DefaultListViewRefresher mounted - listening for video events')
    return () => {
      console.log('DefaultListViewRefresher unmounted')
    }
  }, [])

  // Function to refresh the current page
  const refreshPage = () => {
    console.log('Refreshing default list view due to Mux webhook event')
    try {
      // Try to find and click the refresh button in the list view
      const refreshButton = document.querySelector(
        '.collection-list button[title="Refresh"]',
      ) as HTMLButtonElement
      if (refreshButton) {
        console.log('Found refresh button, clicking it')
        refreshButton.click()
        setLastRefreshed(new Date())
      } else {
        console.log('Refresh button not found, falling back to page reload')
        // Force a hard refresh of the page as a fallback
        window.location.reload()
      }
    } catch (error) {
      console.error('Error refreshing page:', error)
    }
  }

  // Keep track of event counts
  const [eventCounts, setEventCounts] = useState({
    created: 0,
    updated: 0,
  })

  // Listen for video_created events
  useEventBusOn(
    EVENTS.VIDEO_CREATED,
    (data) => {
      setEventCounts((prev) => ({ ...prev, created: prev.created + 1 }))
      console.log(
        `DefaultListViewRefresher received video_created event (${eventCounts.created + 1}):`,
        data,
      )
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        console.log('Refreshing page due to video_created event')
        refreshPage()
      }, 1000)
    },
    [refreshPage, eventCounts.created],
  )

  // Listen for video_updated events
  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    (data) => {
      // Only refresh if the status is 'ready' and it's a new ready status
      if (data.muxData?.status === 'ready' && data.isNewReadyStatus) {
        setEventCounts((prev) => ({ ...prev, updated: prev.updated + 1 }))
        console.log('Video ready, refreshing list view')
        setTimeout(() => refreshPage(), 1000)
      }
    },
    [refreshPage, eventCounts.updated],
  )

  // This component now renders a visible indicator
  return (
    <div className="p-2 mb-4 bg-green-50 border border-green-200 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-green-800">Auto-Refresh Active</h3>
          <p className="text-xs text-green-600">
            The list view will automatically refresh when videos are created or updated via Mux
            webhooks.
            {lastRefreshed && (
              <span className="ml-1">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
            )}
          </p>
          <div className="flex space-x-4 mt-1">
            <div>
              <span className="text-xs text-green-700">Created events: {eventCounts.created}</span>
            </div>
            <div>
              <span className="text-xs text-green-700">Updated events: {eventCounts.updated}</span>
            </div>
          </div>
        </div>
        <button
          onClick={refreshPage}
          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Refresh Now
        </button>
      </div>
    </div>
  )
}

export default DefaultListViewRefresher

