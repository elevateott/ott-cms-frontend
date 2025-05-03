'use client'

import { clientLogger } from '@/utils/clientLogger';


import React, { useEffect, useState } from 'react'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

/**
 * ListViewRefreshButton
 *
 * This component adds a button to the list view that refreshes the list when clicked.
 * It also listens for video_created and video_updated events and automatically refreshes the list.
 */
const ListViewRefreshButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // Function to refresh the list view - DISABLED FOR NOW
  const refreshList = () => {
    clientLogger.info('DISABLED: Would normally refresh list view due to Mux webhook event', 'components/ListViewRefreshButton')
    // Just update the last refreshed time without actually refreshing
    setLastRefreshed(new Date())

    // DISABLED REFRESH CODE
    /*
    try {
      // Find the refresh button in the list view and click it
      const refreshButton = document.querySelector(
        '.collection-list button[title="Refresh"]',
      ) as HTMLButtonElement
      if (refreshButton) {
        clientLogger.info('Found refresh button, clicking it', 'components/ListViewRefreshButton')
        refreshButton.click()
        setLastRefreshed(new Date())
      } else {
        clientLogger.info('Refresh button not found', 'components/ListViewRefreshButton')
        // Fallback to window.location.reload()
        window.location.reload()
      }
    } catch (error) {
      clientLogger.error('Error refreshing list:', error, 'components/ListViewRefreshButton')
    }
    */
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
      clientLogger.info(
        `ListViewRefreshButton received video_created event (${eventCounts.created + 1}, 'components/ListViewRefreshButton'):`,
        data,
      )
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        clientLogger.info('Refreshing list due to video_created event', 'components/ListViewRefreshButton')
        refreshList()
        setLastRefreshed(new Date())
      }, 1000)
    },
    [refreshList, eventCounts.created],
  )

  // Listen for video_updated events
  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    (data) => {
      setEventCounts((prev) => ({ ...prev, updated: prev.updated + 1 }))
      clientLogger.info(
        `ListViewRefreshButton received video_updated event (${eventCounts.updated + 1}, 'components/ListViewRefreshButton'):`,
        data,
      )
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        clientLogger.info('Refreshing list due to video_updated event', 'components/ListViewRefreshButton')

        // Try multiple refresh methods to ensure the list is updated
        try {
          // Method 1: Use our refresh function
          refreshList()
          setLastRefreshed(new Date())

          // Method 2: Force a hard refresh of the collection list
          const refreshButton = document.querySelector(
            '.collection-list button[title="Refresh"]',
          ) as HTMLButtonElement
          if (refreshButton) {
            clientLogger.info('Found refresh button, clicking it directly', 'components/ListViewRefreshButton')
            refreshButton.click()
          }

          // Method 3: Reload the page if the status was updated to 'ready'
          if (data && data.id) {
            clientLogger.info('Checking if we need to reload the page for video:', data.id, 'components/ListViewRefreshButton')
            // If this is a status change to ready, force a page reload
            fetch(`/api/videos/${data.id}`)
              .then((response) => response.json())
              .then((videoData) => {
                if (videoData && videoData.muxData && videoData.muxData.status === 'ready') {
                  clientLogger.info('Video status is ready, reloading the page in 2 seconds', 'components/ListViewRefreshButton')
                  setTimeout(() => {
                    clientLogger.info('Reloading page now', 'components/ListViewRefreshButton')
                    window.location.reload()
                  }, 2000)
                }
              })
              .catch((err) => clientLogger.error('Error fetching video data:', err), 'components/ListViewRefreshButton')
          }
        } catch (error) {
          clientLogger.error('Error during refresh attempts:', error, 'components/ListViewRefreshButton')
        }
      }, 1000)
    },
    [refreshList, eventCounts.updated],
  )

  // Add a button to the list view toolbar when the component mounts
  useEffect(() => {
    clientLogger.info('ListViewRefreshButton mounted - listening for video events', 'components/ListViewRefreshButton')

    // Create a function to add the button to the toolbar
    const addButtonToToolbar = () => {
      // Find the toolbar
      const toolbar = document.querySelector(
        '.collection-list__header .collection-list__header-wrap',
      )

      if (toolbar && !document.getElementById('mux-auto-refresh-button')) {
        clientLogger.info('Found toolbar, adding button', 'components/ListViewRefreshButton')

        // Create the button
        const button = document.createElement('button')
        button.id = 'mux-auto-refresh-button'
        button.className = 'btn btn--style-primary btn--size-small btn--icon-style-without-border'
        button.style.marginLeft = '10px'
        button.innerHTML =
          'Auto-refresh on Mux events: <span style="color: #4caf50; margin-left: 5px;">Active</span>'
        button.title =
          'This list will automatically refresh when videos are created or updated via Mux webhooks'

        // Add the button to the toolbar
        toolbar.appendChild(button)
        setIsVisible(true)
      } else {
        clientLogger.info('Toolbar not found or button already exists', 'components/ListViewRefreshButton')
      }
    }

    // Try to add the button immediately
    addButtonToToolbar()

    // Also try again after a short delay to ensure the DOM is fully loaded
    const timeoutId = setTimeout(addButtonToToolbar, 1000)

    // Try again every 2 seconds until the button is added
    const intervalId = setInterval(() => {
      if (!document.getElementById('mux-auto-refresh-button')) {
        clientLogger.info('Retrying to add button to toolbar', 'components/ListViewRefreshButton')
        addButtonToToolbar()
      } else {
        clearInterval(intervalId)
      }
    }, 2000)

    return () => {
      clientLogger.info('ListViewRefreshButton unmounted', 'components/ListViewRefreshButton')
      clearTimeout(timeoutId)
      clearInterval(intervalId)

      // Remove the button when the component unmounts
      const button = document.getElementById('mux-auto-refresh-button')
      if (button) {
        button.remove()
      }
    }
  }, [])

  // Render a visible component as a fallback
  return (
    <div className="p-2 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">Mux Auto-Refresh Disabled</h3>
          <p className="text-xs text-yellow-600">
            Auto-refresh is currently disabled. Events are still being logged.
            {lastRefreshed && (
              <span className="ml-1">Last event: {lastRefreshed.toLocaleTimeString()}</span>
            )}
          </p>
          <div className="flex space-x-4 mt-1">
            <span className="text-xs text-yellow-700">Created events: {eventCounts.created}</span>
            <span className="text-xs text-yellow-700">Updated events: {eventCounts.updated}</span>
          </div>
        </div>
        <button
          onClick={refreshList}
          className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Manual Refresh
        </button>
      </div>
      {!isVisible && (
        <p className="text-xs text-orange-600 mt-1">
          Note: The auto-refresh button could not be added to the toolbar. This fallback is shown
          instead.
        </p>
      )}
    </div>
  )
}

export default ListViewRefreshButton
