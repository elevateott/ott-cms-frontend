import { clientLogger } from '@/utils/clientLogger'
// src\components\EventProvider\EventBridge.tsx

import { useEffect, useState } from 'react'
import { eventBus } from '@/utilities/eventBus'
import { EVENTS } from '@/constants/events'

// Create a logger specifically for EventBridge
const logger = clientLogger.createContextLogger('EventBridge')

const EventBridge: React.FC = () => {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    logger.info('EventBridge initializing - connecting to SSE stream')

    // Connect to the correct SSE endpoint
    logger.info('Creating EventSource connection to /api/events/stream')
    const eventSource = new EventSource('/api/events/stream')
    logger.info('EventSource connection created, waiting for open event')

    // Helper to forward and log events
    const forwardEvent = (eventName: string) => (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        logger.info(`Received and forwarding event: ${eventName}`, {
          eventName,
          data,
          timestamp: new Date().toISOString(),
          rawData: event.data.substring(0, 100) + (event.data.length > 100 ? '...' : ''),
        })

        // Forward the event to the client-side event bus
        eventBus.emit(eventName, data)

        // Log that the event was forwarded
        logger.debug(`Successfully forwarded ${eventName} to client event bus`)
      } catch (err) {
        logger.error(`Error parsing event data for ${eventName}:`, {
          error: err,
          rawData: event.data,
        })
      }
    }

    // Handle connection open
    eventSource.onopen = () => {
      logger.info('SSE connection established')
      setConnected(true)
      // Emit a connection event to the client event bus
      eventBus.emit('server_connected', { timestamp: Date.now() })

      // Log the connection status
      logger.info('EventBridge: SSE connection established, emitted server_connected event')
    }

    // Handle connection error
    eventSource.onerror = (error) => {
      logger.error('SSE connection error', { error })
      setConnected(false)
      eventBus.emit('server_error', { timestamp: Date.now(), error: 'Connection error' })
    }

    // Listen for the connected event from the server
    eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data)
        logger.info('Received connected event from server', { data })
        setConnected(true)
        eventBus.emit('server_connected', data)

        // Log the connection ID
        logger.info(`EventBridge: Connected to server with ID: ${data.connectionId}`, {
          connectionId: data.connectionId,
          timestamp: data.timestamp,
        })
      } catch (err) {
        logger.error('Error parsing connected event data', { error: err })
      }
    })

    // Listen for ping events to keep the connection alive
    eventSource.addEventListener('ping', (event) => {
      logger.debug('Received ping from server', { timestamp: event.data })
    })

    // Register listeners for all known events
    Object.values(EVENTS).forEach((eventName) => {
      logger.debug(`Registering listener for event: ${eventName}`)
      eventSource.addEventListener(eventName, forwardEvent(eventName))
    })

    // Also listen for any message event (fallback for events not in EVENTS)
    eventSource.onmessage = (event) => {
      try {
        logger.info('Received generic message event', {
          data: event.data,
          timestamp: new Date().toISOString(),
          rawData: event.data.substring(0, 100) + (event.data.length > 100 ? '...' : ''),
        })

        const data = JSON.parse(event.data)

        // Try to extract event type from the data
        const eventType = data.type || 'unknown'
        logger.info(`Forwarding generic message as event: ${eventType}`, {
          eventType,
          data,
          timestamp: new Date().toISOString(),
        })

        // Forward the event to the client-side event bus
        eventBus.emit(eventType, data)

        // Log that the event was forwarded
        logger.debug(`Successfully forwarded generic message as ${eventType} to client event bus`)
      } catch (err) {
        logger.error('Error handling generic message event', {
          error: err,
          rawData: event.data,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Cleanup function
    return () => {
      logger.info('EventBridge unmounting - closing SSE connection')
      eventSource.close()
      setConnected(false)
    }
  }, [])

  // Log connection status changes
  useEffect(() => {
    logger.info(`Connection status changed: ${connected ? 'connected' : 'disconnected'}`)
  }, [connected])

  return null
}

export default EventBridge
