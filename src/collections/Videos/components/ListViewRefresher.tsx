'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'
import { useRefreshListView } from '@/hooks/useRefreshListView'
import { useVideoStatus } from '@/context/VideoStatusContext'

/**
 * ListViewRefresher
 *
 * This component is specifically designed to refresh the Payload CMS list view
 * when videos are created or updated. It listens for events and triggers a refresh
 * of the list view without reloading the entire page.
 */
const ListViewRefresher: React.FC = () => {
  const { refreshListView } = useRefreshListView()
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)

  // Get the video status context
  const { updateStatus, subscribeToStatusUpdates } = useVideoStatus()

  // Listen for video_created events
  useEventBusOn(
    EVENTS.VIDEO_CREATED,
    (data) => {
      console.log(`🔍 DEBUG [ListViewRefresher] Received video_created event:`, data)

      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        console.log('🔍 DEBUG [ListViewRefresher] Refreshing list view due to video_created event')
        if (refreshListView()) {
          setLastRefreshed(new Date())
          setRefreshCount((prev) => prev + 1)
        }
      }, 1000)
    },
    [],
  )

  // Listen for video_updated events
  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    (data) => {
      console.log(`🔍 DEBUG [ListViewRefresher] Received video_updated event:`, data)

      // Only refresh if the status is 'ready' and it's a new ready status
      if (data.isStatusChange) {
        console.log('🔍 DEBUG [ListViewRefresher] Status change detected, updating context')

        // Update the video status in the context
        if (data && data.id) {
          console.log(
            '🔍 DEBUG [ListViewRefresher] Updating status in context to ready for video:',
            data.id,
          )
          updateStatus(data.id, 'ready')

          // Update the status in the context
          console.log('🔍 DEBUG [ListViewRefresher] Status updated in context to ready')
        }

        // Add a small delay to ensure the database has been updated
        // Use multiple refreshes with increasing delays to ensure the list view is updated
        const refreshWithDelays = () => {
          console.log('🔍 DEBUG [ListViewRefresher] Refreshing list view (first attempt)')
          refreshListView()
          setLastRefreshed(new Date())
          setRefreshCount((prev) => prev + 1)

          // Schedule additional refreshes with increasing delays
          setTimeout(() => {
            console.log('🔍 DEBUG [ListViewRefresher] Refreshing list view (second attempt)')
            refreshListView()
            setLastRefreshed(new Date())

            // One more refresh after a longer delay
            setTimeout(() => {
              console.log('🔍 DEBUG [ListViewRefresher] Refreshing list view (third attempt)')
              refreshListView()
              setLastRefreshed(new Date())
            }, 3000)
          }, 2000)
        }

        // Start the refresh sequence after a short initial delay
        setTimeout(refreshWithDelays, 1000)
      }
    },
    [refreshListView, updateStatus],
  )

  // Listen for video:status:ready events specifically
  useEventBusOn(
    'video:status:ready',
    (data) => {
      console.log(`🔍 DEBUG [ListViewRefresher] Received video:status:ready event:`, data)

      // Update the video status in the context
      if (data && data.id) {
        console.log(
          '🔍 DEBUG [ListViewRefresher] Updating status in context to ready for video:',
          data.id,
        )
        updateStatus(data.id, 'ready')

        // Update the status in the context
        console.log('🔍 DEBUG [ListViewRefresher] Status updated in context to ready')
      }

      // Add a small delay to ensure the database has been updated
      // Use multiple refreshes with increasing delays to ensure the list view is updated
      const refreshWithDelays = () => {
        console.log(
          '🔍 DEBUG [ListViewRefresher] Refreshing list view due to video:status:ready event (first attempt)',
        )
        refreshListView()
        setLastRefreshed(new Date())
        setRefreshCount((prev) => prev + 1)

        // Schedule additional refreshes with increasing delays
        setTimeout(() => {
          console.log('🔍 DEBUG [ListViewRefresher] Refreshing list view (second attempt)')
          refreshListView()
          setLastRefreshed(new Date())

          // One more refresh after a longer delay
          setTimeout(() => {
            console.log('🔍 DEBUG [ListViewRefresher] Refreshing list view (third attempt)')
            refreshListView()
            setLastRefreshed(new Date())
          }, 3000)
        }, 2000)
      }

      // Start the refresh sequence after a short initial delay
      setTimeout(refreshWithDelays, 1000)
    },
    [refreshListView, updateStatus],
  )

  // Listen for the REFRESH_LIST_VIEW event
  useEventBusOn(
    EVENTS.REFRESH_LIST_VIEW,
    (data) => {
      console.log(`🔍 DEBUG [ListViewRefresher] Received REFRESH_LIST_VIEW event:`, data)

      // Refresh immediately
      if (refreshListView()) {
        setLastRefreshed(new Date())
        setRefreshCount((prev) => prev + 1)
      }
    },
    [refreshListView],
  )

  // Status update subscription is already set up above

  // Set up a listener for status changes that will refresh the list view
  useEffect(() => {
    console.log('🔍 DEBUG [ListViewRefresher] Setting up status change listener')

    // Subscribe to status updates
    const unsubscribe = subscribeToStatusUpdates((videoId, status) => {
      console.log(
        `🔍 DEBUG [ListViewRefresher] Received status update for video ${videoId}: ${status}`,
      )

      // Only refresh on status changes to 'ready'
      if (status === 'ready') {
        console.log('🔍 DEBUG [ListViewRefresher] Status changed to ready, refreshing list view')
        refreshListView()
        setRefreshCount((prev) => prev + 1)
        setLastRefreshed(new Date())
      }
    })

    // Clean up subscription when component unmounts
    return () => {
      console.log('🔍 DEBUG [ListViewRefresher] Cleaning up status change listener')
      unsubscribe()
    }
  }, [refreshListView, subscribeToStatusUpdates, setRefreshCount, setLastRefreshed])

  // This component renders a small indicator in the corner
  return (
    <div className="fixed bottom-4 right-4 bg-green-100 p-2 rounded-md shadow-md z-50 text-xs">
      <div className="font-medium text-green-800">List View Refresher Active</div>
      {lastRefreshed && (
        <div className="text-green-600">Last refreshed: {lastRefreshed.toLocaleTimeString()}</div>
      )}
      <div className="text-green-600">Events: {refreshCount}</div>
      <div className="text-green-600">Auto-refresh on status changes</div>
      <button
        onClick={() => refreshListView()}
        className="mt-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Refresh Now
      </button>
    </div>
  )
}

export default ListViewRefresher
