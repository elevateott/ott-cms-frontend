'use client'

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

  // Function to refresh the list view
  const refreshList = () => {
    console.log('Refreshing list view due to Mux webhook event')
    try {
      // Find the refresh button in the list view and click it
      const refreshButton = document.querySelector(
        '.collection-list button[title="Refresh"]',
      ) as HTMLButtonElement
      if (refreshButton) {
        console.log('Found refresh button, clicking it')
        refreshButton.click()
        setLastRefreshed(new Date())
      } else {
        console.log('Refresh button not found')
        // Fallback to window.location.reload()
        window.location.reload()
      }
    } catch (error) {
      console.error('Error refreshing list:', error)
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
        `ListViewRefreshButton received video_created event (${eventCounts.created + 1}):`,
        data,
      )
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        console.log('Refreshing list due to video_created event')
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
      console.log(
        `ListViewRefreshButton received video_updated event (${eventCounts.updated + 1}):`,
        data,
      )
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        console.log('Refreshing list due to video_updated event')

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
            console.log('Found refresh button, clicking it directly')
            refreshButton.click()
          }

          // Method 3: Reload the page if the status was updated to 'ready'
          if (data && data.id) {
            console.log('Checking if we need to reload the page for video:', data.id)
            // If this is a status change to ready, force a page reload
            fetch(`/api/videos/${data.id}`)
              .then((response) => response.json())
              .then((videoData) => {
                if (videoData && videoData.muxData && videoData.muxData.status === 'ready') {
                  console.log('Video status is ready, reloading the page in 2 seconds')
                  setTimeout(() => {
                    console.log('Reloading page now')
                    window.location.reload()
                  }, 2000)
                }
              })
              .catch((err) => console.error('Error fetching video data:', err))
          }
        } catch (error) {
          console.error('Error during refresh attempts:', error)
        }
      }, 1000)
    },
    [refreshList, eventCounts.updated],
  )

  // Add a button to the list view toolbar when the component mounts
  useEffect(() => {
    console.log('ListViewRefreshButton mounted - listening for video events')

    // Create a function to add the button to the toolbar
    const addButtonToToolbar = () => {
      // Find the toolbar
      const toolbar = document.querySelector(
        '.collection-list__header .collection-list__header-wrap',
      )

      if (toolbar && !document.getElementById('mux-auto-refresh-button')) {
        console.log('Found toolbar, adding button')

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
        console.log('Toolbar not found or button already exists')
      }
    }

    // Try to add the button immediately
    addButtonToToolbar()

    // Also try again after a short delay to ensure the DOM is fully loaded
    const timeoutId = setTimeout(addButtonToToolbar, 1000)

    // Try again every 2 seconds until the button is added
    const intervalId = setInterval(() => {
      if (!document.getElementById('mux-auto-refresh-button')) {
        console.log('Retrying to add button to toolbar')
        addButtonToToolbar()
      } else {
        clearInterval(intervalId)
      }
    }, 2000)

    return () => {
      console.log('ListViewRefreshButton unmounted')
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
    <div className="p-2 mb-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-800">Mux Auto-Refresh</h3>
          <p className="text-xs text-blue-600">
            This list will automatically refresh when videos are created or updated via Mux
            webhooks.
            {lastRefreshed && (
              <span className="ml-1">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
            )}
          </p>
          <div className="flex space-x-4 mt-1">
            <span className="text-xs text-blue-700">Created events: {eventCounts.created}</span>
            <span className="text-xs text-blue-700">Updated events: {eventCounts.updated}</span>
          </div>
        </div>
        <button
          onClick={refreshList}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Now
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
