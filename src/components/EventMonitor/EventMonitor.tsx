'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { EVENTS } from '@/constants/events'
import { useEventSource } from '@/hooks/useEventSource'
import { API_ROUTES } from '@/constants/api'
import { eventBus } from '@/utilities/eventBus'

interface EventLog {
  id: string
  timestamp: Date
  eventName: string
  data: any
  source: 'server' | 'client'
}

export function EventMonitor() {
  const [logs, setLogs] = useState<EventLog[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [isExpanded, setIsExpanded] = useState(false)
  const [filter, setFilter] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)
  const eventContainerRef = useRef<HTMLDivElement>(null)

  const clearLogs = () => {
    setLogs([])
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  // Filter events based on search input
  const filteredEvents = logs.filter(event =>
    event.eventName.toLowerCase().includes(filter.toLowerCase())
  )

  // Helper function to get event name color
  const getEventColor = (eventName: string) => {
    if (eventName.includes('error')) return 'text-red-600'
    if (eventName.includes('created')) return 'text-green-600'
    if (eventName.includes('updated')) return 'text-blue-600'
    return 'text-gray-600'
  }

  // Helper function to get source color
  const getSourceColor = (source: 'server' | 'client') => {
    return source === 'server' ? 'text-purple-600' : 'text-orange-600'
  }

  const logEvent = useCallback((eventName: string, data: any, source: 'server' | 'client') => {
    console.log(`🎯 EventMonitor: Logging ${source} event:`, { eventName, data })

    setLogs((prevLogs) => [
      ...prevLogs,
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        eventName,
        data,
        source,
      },
    ])
  }, [])

  // Set up event source for server-sent events
  const { connected } = useEventSource({
    url: API_ROUTES.EVENTS,
    events: {
      connected: (data) => {
        console.log('🎯 EventMonitor: Connected to event source', data)
        logEvent('connected', data, 'server')
      },
      ping: (data) => {
        console.log('🎯 EventMonitor: Received ping', data)
      },
      ...Object.fromEntries(
        Object.values(EVENTS).map(eventName => [
          eventName,
          (data: any) => {
            console.log(`🎯 EventMonitor: Received ${eventName} event`, data)
            logEvent(eventName, data, 'server')
          }
        ])
      )
    },
    onOpen: () => {
      console.log('🎯 EventMonitor: SSE Connection opened')
      setConnectionStatus('connected')
    },
    onError: (error) => {
      console.error('🎯 EventMonitor: SSE Connection error:', error)
      setConnectionStatus('error')
    }
  })

  // Listen for client-side events
  useEffect(() => {
    console.log('🎯 EventMonitor: Setting up client event listeners')

    const eventNames = Object.values(EVENTS)
    const unsubscribes = eventNames.map((eventName) =>
      eventBus.on(eventName, (data) => {
        console.log(`🎯 EventMonitor: Received client event: ${eventName}`, data)
        logEvent(eventName, data, 'client')
      })
    )

    return () => {
      console.log('🎯 EventMonitor: Cleaning up client event listeners')
      unsubscribes.forEach((unsub) => unsub())
    }
  }, [])

  // Scroll to bottom when new logs are added
  useEffect(() => {
    if (logsEndRef.current && isExpanded) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isExpanded])

  return (
    <div
      className={`fixed bottom-4 left-4 bg-white border border-gray-200 rounded-md shadow-lg z-50 transition-all duration-300 ${
        isExpanded ? 'w-96 h-96' : 'w-64 h-auto'
      }`}
    >
      <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-sm font-medium text-gray-800">Event Monitor</h3>
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
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearLogs}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
          >
            Clear
          </button>
          <button
            onClick={toggleExpanded}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            {isExpanded ? 'Minimize' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-2 border-b border-gray-200">
          <input
            type="text"
            placeholder="Filter events..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          />
        </div>
      )}

      <div
        ref={eventContainerRef}
        className={`overflow-auto ${isExpanded ? 'h-[calc(100%-6rem)]' : 'max-h-40'}`}
      >
        {filteredEvents.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 italic">No events recorded yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-2 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-medium ${getEventColor(event.eventName)}`}>
                    {event.eventName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${getSourceColor(event.source)}`}>{event.source}</span>
                </div>
                {isExpanded && (
                  <pre className="mt-1 text-xs bg-gray-50 p-1 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        {logs.length} events recorded
      </div>
    </div>
  )
}

export default EventMonitor








