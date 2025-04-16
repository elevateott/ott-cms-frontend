'use client'

import React, { useEffect, useState, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'
import { useVideoStatus } from '@/context/VideoStatusContext'

/**
 * DefaultListViewRefresher
 *
 * This component listens for video_created and video_updated events
 * and refreshes the default Payload CMS list view when they occur.
 *
 * It's designed to be added to the beforeList array in the Videos collection config.
 */
const DefaultListViewRefresher: React.FC = () => {
  // const router = useRouter()
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // Keep track of event counts
  const [eventCounts, setEventCounts] = useState({
    created: 0,
    updated: 0,
  })

  // Get the video status context
  const { updateStatus, subscribeToStatusUpdates } = useVideoStatus()

  // Log when component is mounted
  useEffect(() => {
    console.log('DefaultListViewRefresher mounted - listening for video events')
    return () => {
      console.log('DefaultListViewRefresher unmounted')
    }
  }, [])

  // Function to refresh the current page
  const refreshPage = useCallback(() => {
    console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing default list view')
    setLastRefreshed(new Date())

    try {
      // Try to find and click the refresh button in the list view
      const refreshButton = document.querySelector(
        '.collection-list button[title="Refresh"]',
      ) as HTMLButtonElement
      if (refreshButton) {
        console.log('🔍 DEBUG [DefaultListViewRefresher] Found refresh button, clicking it')
        refreshButton.click()
        setLastRefreshed(new Date())
        return true
      } else {
        console.log('🔍 DEBUG [DefaultListViewRefresher] Refresh button not found')
        return false
      }
    } catch (error) {
      console.error('🔍 DEBUG [DefaultListViewRefresher] Error refreshing page:', error)
      return false
    }
  }, [setLastRefreshed])

  // Status update subscription is already set up above

  // Set up a listener for status changes that will refresh the list view
  useEffect(() => {
    console.log('🔍 DEBUG [DefaultListViewRefresher] Setting up status change listener')

    // Subscribe to status updates
    const unsubscribe = subscribeToStatusUpdates((videoId, status) => {
      console.log(
        `🔍 DEBUG [DefaultListViewRefresher] Received status update for video ${videoId}: ${status}`,
      )

      // Only refresh on status changes to 'ready'
      if (status === 'ready') {
        console.log(
          '🔍 DEBUG [DefaultListViewRefresher] Status changed to ready, refreshing list view',
        )
        refreshPage()
        setEventCounts((prev) => ({ ...prev, updated: prev.updated + 1 }))
      }
    })

    // Clean up subscription when component unmounts
    return () => {
      console.log('🔍 DEBUG [DefaultListViewRefresher] Cleaning up status change listener')
      unsubscribe()
    }
  }, [refreshPage, subscribeToStatusUpdates, setEventCounts])

  // Event counts state is already defined above

  // Listen for video_created events
  useEventBusOn(
    EVENTS.VIDEO_CREATED,
    (data) => {
      setEventCounts((prev) => ({ ...prev, created: prev.created + 1 }))
      console.log(
        `🔍 DEBUG [DefaultListViewRefresher] Received video_created event (${eventCounts.created + 1}):`,
        data,
      )
      console.log(`🔍 DEBUG [DefaultListViewRefresher] Event type:`, EVENTS.VIDEO_CREATED)

      // Use multiple refreshes with increasing delays to ensure the list view is updated
      setTimeout(() => {
        console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (first attempt)')
        refreshPage()

        // Schedule additional refreshes
        setTimeout(() => {
          console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (second attempt)')
          refreshPage()

          // One more refresh after a longer delay
          setTimeout(() => {
            console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (third attempt)')
            refreshPage()
          }, 3000)
        }, 2000)
      }, 1000)
    },
    [refreshPage, eventCounts.created],
  )

  // Listen for video_updated events
  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    (data) => {
      console.log(`🔍 DEBUG [DefaultListViewRefresher] Received video_updated event:`, data)
      console.log(`🔍 DEBUG [DefaultListViewRefresher] Event type:`, EVENTS.VIDEO_UPDATED)

      // Only refresh if the status is 'ready' and it's a new ready status
      if (data.isStatusChange) {
        setEventCounts((prev) => ({ ...prev, updated: prev.updated + 1 }))
        console.log('🔍 DEBUG [DefaultListViewRefresher] Status change detected, updating context')
        console.log('🔍 DEBUG [DefaultListViewRefresher] Data details:', JSON.stringify(data))

        // Update the video status in the context
        if (data && data.id) {
          console.log(
            '🔍 DEBUG [DefaultListViewRefresher] Updating status in context to ready for video:',
            data.id,
          )
          updateStatus(data.id, 'ready')

          // Update the status in the context
          console.log('🔍 DEBUG [DefaultListViewRefresher] Status updated in context to ready')

          setLastRefreshed(new Date())
        }

        // Use multiple refreshes with increasing delays
        setTimeout(() => {
          console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (first attempt)')
          refreshPage()

          // Schedule additional refreshes
          setTimeout(() => {
            console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (second attempt)')
            refreshPage()

            // One more refresh after a longer delay
            setTimeout(() => {
              console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (third attempt)')
              refreshPage()
            }, 3000)
          }, 2000)
        }, 1000)
      } else {
        console.log('🔍 DEBUG [DefaultListViewRefresher] Not a status change event, ignoring')
      }
    },
    [refreshPage, eventCounts.updated, updateStatus],
  )

  // Listen for video:status:ready events specifically
  useEventBusOn(
    'video:status:ready',
    (data) => {
      console.log(`🔍 DEBUG [DefaultListViewRefresher] Received video:status:ready event:`, data)
      setEventCounts((prev) => ({ ...prev, updated: prev.updated + 1 }))
      console.log(
        '🔍 DEBUG [DefaultListViewRefresher] Video ready event received, updating context',
      )

      // Update the video status in the context
      if (data && data.id) {
        updateStatus(data.id, 'ready')

        // Update the status in the context
        console.log('🔍 DEBUG [DefaultListViewRefresher] Status updated in context to ready')

        setLastRefreshed(new Date())
      }

      // Use multiple refreshes with increasing delays
      setTimeout(() => {
        console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (first attempt)')
        refreshPage()

        // Schedule additional refreshes
        setTimeout(() => {
          console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (second attempt)')
          refreshPage()

          // One more refresh after a longer delay
          setTimeout(() => {
            console.log('🔍 DEBUG [DefaultListViewRefresher] Refreshing page (third attempt)')
            refreshPage()
          }, 3000)
        }, 2000)
      }, 1000)
    },
    [refreshPage, eventCounts.updated, updateStatus],
  )

  // This component now renders a visible indicator
  return (
    <div className="p-2 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">Auto-Refresh Disabled</h3>
          <p className="text-xs text-yellow-600">
            Auto-refresh is currently disabled. Events are still being logged.
            {lastRefreshed && (
              <span className="ml-1">Last event: {lastRefreshed.toLocaleTimeString()}</span>
            )}
          </p>
          <div className="flex space-x-4 mt-1">
            <div>
              <span className="text-xs text-yellow-700">Created events: {eventCounts.created}</span>
            </div>
            <div>
              <span className="text-xs text-yellow-700">Updated events: {eventCounts.updated}</span>
            </div>
          </div>
        </div>
        <button
          onClick={refreshPage}
          className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Manual Refresh
        </button>
      </div>
    </div>
  )
}

export default DefaultListViewRefresher
