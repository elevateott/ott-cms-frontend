'use client'

import { clientLogger } from '@/utils/clientLogger'

// src\components\EventMonitor\EventMonitor.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { eventBus } from '@/services/events/eventEmitter'
import { EVENTS } from '@/constants/events'

// Create a context-specific logger
const logger = clientLogger.createContextLogger('EventMonitor')

interface EventLog {
  id: string
  type: string
  data: unknown
  timestamp: string
}

export const EventMonitor: React.FC = () => {
  logger.debug('EventMonitor component initializing')
  const [events, setEvents] = useState<EventLog[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Generate a unique ID for events
  const generateId = useCallback(() => {
    // Use crypto.randomUUID() if available, otherwise fallback to Math.random
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }, [])

  const addEvent = useCallback(
    (type: string, data: unknown) => {
      const eventId = generateId()
      logger.info(`📝 Received event: ${type}`, { eventId, eventType: type, eventData: data })

      setEvents((prev) => {
        const newEvents = [
          {
            id: eventId,
            type,
            data,
            timestamp: new Date().toISOString(),
          },
          ...prev.slice(0, 99), // Keep last 100 events
        ]
        logger.debug(`Updated events array, now contains ${newEvents.length} events`, {
          latestEventId: eventId,
          totalEvents: newEvents.length,
        })
        return newEvents
      })
    },
    [generateId],
  )

  // Add lifecycle logging and SSE connection
  useEffect(() => {
    logger.info('EventMonitor component mounted')

    // Subscribe to client-side events via eventBus
    const clientEventSubscriptions = Object.entries(EVENTS).map(([_, eventName]) => {
      logger.debug(`Subscribing to client event: ${eventName}`)
      // Store the event name and handler function for later unsubscribe
      const handler = (data: unknown) => {
        addEvent(eventName, data)
      }
      eventBus.on(eventName, handler)
      return { eventName, handler }
    })

    // Connect to SSE stream directly
    logger.info('Connecting to SSE stream...')
    const eventSource = new EventSource('/api/events/stream')

    // Handle connection open
    eventSource.onopen = () => {
      logger.info('SSE connection opened')
    }

    // Handle connection error
    eventSource.onerror = (error) => {
      logger.error('SSE connection error', { error })
    }

    // Handle connected event
    eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data)
        logger.info('Received connected event from server', { data })
        addEvent('connected', data)
      } catch (err) {
        logger.error('Error parsing connected event data', { error: err })
      }
    })

    // Handle ping events
    eventSource.addEventListener('ping', (event) => {
      logger.debug('Received ping from server', { timestamp: event.data })
    })

    // Register listeners for all events directly from SSE
    Object.values(EVENTS).forEach((eventName) => {
      logger.debug(`Registering SSE listener for event: ${eventName}`)
      eventSource.addEventListener(eventName, (event) => {
        try {
          const data = JSON.parse(event.data)
          logger.info(`Received SSE event: ${eventName}`, { eventName, data })
          addEvent(eventName, data)
        } catch (err) {
          logger.error(`Error parsing SSE event data for ${eventName}:`, { error: err })
        }
      })
    })

    return () => {
      logger.info('EventMonitor component unmounting - cleaning up')
      // Unsubscribe from client-side events
      clientEventSubscriptions.forEach(({ eventName, handler }) => {
        logger.debug(`Unsubscribing from client event: ${eventName}`)
        eventBus.off(eventName, handler)
      })
      // Close SSE connection
      eventSource.close()
      logger.info('EventMonitor component unmounted')
    }
  }, [addEvent])

  // Log when expanded/collapsed
  useEffect(() => {
    logger.debug(`EventMonitor display state changed: ${isExpanded ? 'expanded' : 'collapsed'}`, {
      isExpanded,
      eventsCount: events.length,
    })
  }, [isExpanded, events.length])

  // Handle expand/collapse
  const handleExpand = useCallback(() => {
    logger.debug('Expanding EventMonitor', { currentEvents: events.length })
    setIsExpanded(true)
  }, [events.length])

  const handleCollapse = useCallback(() => {
    logger.debug('Collapsing EventMonitor')
    setIsExpanded(false)
  }, [])

  // Handle clear events
  const handleClearEvents = useCallback(() => {
    logger.info('Clearing all events', { eventsCleared: events.length })
    setEvents([])
  }, [events.length])

  if (!isExpanded) {
    return (
      <button
        className="fixed bottom-4 left-4 bg-blue-500 text-white p-2 rounded"
        onClick={handleExpand}
      >
        Show Event Monitor ({events.length})
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      <div className="p-2 bg-blue-500 text-white flex justify-between items-center">
        <h3>Event Monitor</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleClearEvents}
            className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
          >
            Clear
          </button>
          <button onClick={handleCollapse}>Minimize</button>
        </div>
      </div>
      <div className="p-2 h-full overflow-auto">
        {events.length === 0 ? (
          <div className="text-center text-gray-500 mt-4">No events captured yet</div>
        ) : (
          events.map((event) => {
            logger.debug(`Rendering event ${event.id}`, { eventType: event.type })
            return (
              <div key={event.id} className="mb-2 p-2 border-b border-gray-200">
                <div className="font-bold text-sm">{event.type}</div>
                <div className="text-xs text-gray-500">{event.timestamp}</div>
                <pre className="text-xs mt-1 bg-gray-50 p-1 rounded">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default EventMonitor
