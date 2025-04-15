'use client'

import React, { useEffect, useState } from 'react'
import { EVENTS } from '@/constants/events'

/**
 * GlobalEventListener
 *
 * This component adds a global event listener to the window to listen for
 * server-sent events directly, bypassing the event bus.
 */
const GlobalEventListener: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting')
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    console.log('GlobalEventListener mounted - adding direct event source listener')

    // Create an EventSource connection to the server
    const eventSource = new EventSource('/api/events')

    // Function to refresh the list view
    const refreshList = () => {
      console.log('Refreshing list view due to direct event source event')
      try {
        // Find the refresh button in the list view and click it
        const refreshButton = document.querySelector(
          '.collection-list button[title="Refresh"]',
        ) as HTMLButtonElement
        if (refreshButton) {
          console.log('Found refresh button, clicking it')
          refreshButton.click()
          setLastRefreshed(new Date())
          setEventCount((prev) => prev + 1)
        } else {
          console.log('Refresh button not found')
        }
      } catch (error) {
        console.error('Error refreshing list:', error)
      }
    }

    // Listen for video_created events
    eventSource.addEventListener(EVENTS.VIDEO_CREATED, (event) => {
      console.log('GlobalEventListener received direct video_created event:', event)
      try {
        const data = JSON.parse(event.data)
        console.log('Parsed video_created event data:', data)
      } catch (error) {
        console.error('Error parsing video_created event data:', error)
      }
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        console.log('Refreshing list due to video_created event')
        refreshList()
      }, 1000)
    })

    // Listen for video_updated events
    eventSource.addEventListener(EVENTS.VIDEO_UPDATED, (event) => {
      console.log('GlobalEventListener received direct video_updated event:', event)
      try {
        const data = JSON.parse(event.data)
        console.log('Parsed video_updated event data:', data)

        // Add a small delay to ensure the database has been updated
        setTimeout(() => {
          console.log('Refreshing list due to video_updated event')

          // Try multiple refresh methods to ensure the list is updated
          try {
            // Method 1: Click the refresh button
            refreshList()

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
      } catch (error) {
        console.error('Error parsing video_updated event data:', error)
      }
    })

    // Listen for reload:page events
    eventSource.addEventListener('reload:page', (event) => {
      console.log('GlobalEventListener received reload:page event:', event)
      try {
        const data = JSON.parse(event.data)
        console.log('Parsed reload:page event data:', data)

        // Reload the page after a short delay
        setTimeout(() => {
          console.log('Reloading page due to reload:page event')
          window.location.reload()
        }, 2000)
      } catch (error) {
        console.error('Error parsing reload:page event data:', error)
      }
    })

    // Listen for video:status:ready events
    eventSource.addEventListener('video:status:ready', (event) => {
      console.log('GlobalEventListener received video:status:ready event:', event)
      try {
        const data = JSON.parse(event.data)
        console.log('Parsed video:status:ready event data:', data)

        // Reload the page after a short delay
        setTimeout(() => {
          console.log('Reloading page due to video:status:ready event')
          window.location.reload()
        }, 2000)
      } catch (error) {
        console.error('Error parsing video:status:ready event data:', error)
      }
    })

    // Listen for connection events
    eventSource.addEventListener('open', () => {
      console.log('GlobalEventListener: EventSource connection opened')
      setConnectionStatus('connected')
    })

    // Listen for errors
    eventSource.addEventListener('error', (error) => {
      console.error('GlobalEventListener: EventSource error:', error)
      setConnectionStatus('disconnected')
    })

    return () => {
      console.log('GlobalEventListener unmounted - closing event source')
      eventSource.close()
      setConnectionStatus('disconnected')
    }
  }, [])

  // This component now renders a visible indicator
  return (
    <div className="p-2 mb-4 bg-purple-50 border border-purple-200 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-purple-800">
            Direct Event Source
            <span
              className="ml-2 px-2 py-0.5 text-xs rounded-full"
              style={{
                backgroundColor:
                  connectionStatus === 'connected'
                    ? '#10b981'
                    : connectionStatus === 'connecting'
                      ? '#f59e0b'
                      : '#ef4444',
                color: 'white',
              }}
            >
              {connectionStatus}
            </span>
          </h3>
          <p className="text-xs text-purple-600">
            Listening for server-sent events directly.
            {lastRefreshed && (
              <span className="ml-1">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
            )}
            {eventCount > 0 && <span className="ml-1">Events received: {eventCount}</span>}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Reconnect
        </button>
      </div>
    </div>
  )
}

export default GlobalEventListener
