'use client'

import React, { useState } from 'react'
import { EVENTS } from '@/constants/events'
import EventMonitor from '@/components/EventMonitor'
import { useEventSource } from '@/hooks/useEventSource'
import { API_ROUTES } from '@/constants/api'

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

  // Function to refresh the list view - DISABLED FOR NOW
  const refreshList = () => {
    console.log('DISABLED: Would normally refresh list view due to direct event source event')
    // Just update the last refreshed time without actually refreshing
    setLastRefreshed(new Date())
    setEventCount((prev) => prev + 1)
  }

  // Use the useEventSource hook instead of direct EventSource
  const { connected } = useEventSource({
    url: API_ROUTES.EVENTS,
    events: {
      [EVENTS.VIDEO_CREATED]: (data) => {
        console.log('🎧 GlobalEventListener received VIDEO_CREATED event:', data)
        refreshList()
      },
      [EVENTS.VIDEO_UPDATED]: (data) => {
        console.log('🎧 GlobalEventListener received VIDEO_UPDATED event:', data)
        refreshList()
      },
      [EVENTS.VIDEO_STATUS_READY]: (data) => {
        console.log('🎧 GlobalEventListener received VIDEO_STATUS_READY event:', data)
        refreshList()
      },
      'video:status:updated': (data) => {
        console.log('🎧 GlobalEventListener received video:status:updated event:', data)
        refreshList()
      },
      'reload:page': (data) => {
        console.log('🎧 GlobalEventListener received reload:page event:', data)
        refreshList()
      }
    },
    onOpen: () => {
      console.log('GlobalEventListener: EventSource connection opened')
      setConnectionStatus('connected')
    },
    onError: (error) => {
      console.error('GlobalEventListener: EventSource error:', error)
      setConnectionStatus('disconnected')
    }
  })

  // Update connection status when connected changes
  React.useEffect(() => {
    setConnectionStatus(connected ? 'connected' : 'disconnected')
  }, [connected])

  // This component now renders a visible indicator
  return (
    <>
      <div className="p-2 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Direct Event Source (Auto-Refresh Disabled)
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
            <p className="text-xs text-yellow-600">
              Listening for server-sent events directly (refresh disabled).
              {lastRefreshed && (
                <span className="ml-1">Last event: {lastRefreshed.toLocaleTimeString()}</span>
              )}
              {eventCount > 0 && <span className="ml-1">Events received: {eventCount}</span>}
            </p>
          </div>
          <button
            onClick={() => console.log('DISABLED: Would normally reconnect')}
            className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Manual Refresh
          </button>
        </div>
      </div>

      {/* Add the EventMonitor component */}
      <EventMonitor />
    </>
  )
}

export default GlobalEventListener




