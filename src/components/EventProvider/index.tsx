'use client'

import { clientLogger } from '@/utils/clientLogger'

//src\components\EventProvider\index.tsx

import { useEffect, useState } from 'react'
import EventBridge from '@/components/EventProvider/EventBridge'
import { eventBus } from '@/utilities/eventBus'
import { EVENTS } from '@/constants/events'
import { EventContext } from './EventContext'

// Create a logger specifically for EventProvider
const logger = clientLogger.createContextLogger('EventProvider')

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState<boolean>(false)
  const [lastEvent, setLastEvent] = useState<{ type: string; data: unknown } | null>(null)
  const [mounted, setMounted] = useState(false)

  // Handle component mounting
  useEffect(() => {
    logger.info('EventProvider mounting')
    setMounted(true)
    return () => {
      logger.info('EventProvider unmounting')
      setMounted(false)
    }
  }, [])

  // Handle server connection status
  useEffect(() => {
    logger.debug('Setting up server connection listener')
    const unsubscribe = eventBus.on('server_connected', () => {
      logger.info('Server connected event received')
      setConnected(true)
    })

    return () => {
      logger.debug('Cleaning up server connection listener')
      unsubscribe()
    }
  }, [])

  // Track connection status changes
  useEffect(() => {
    logger.info(`Connection status: ${connected ? 'connected' : 'disconnected'}`)
  }, [connected])

  // Subscribe to all events
  useEffect(() => {
    logger.debug('Setting up event listeners')

    const handleEvent = (type: string) => (data: unknown) => {
      logger.info(`Event received: ${type}`, { eventType: type, eventData: data })
      setLastEvent({ type, data })
    }

    // Subscribe to all events defined in EVENTS
    const unsubscribes = Object.values(EVENTS).map((event) => {
      logger.debug(`Subscribing to event: ${event}`)
      return eventBus.on(event, handleEvent(event))
    })

    // Also subscribe to system events
    unsubscribes.push(
      eventBus.on('server_connected', handleEvent('server_connected')),
      eventBus.on('server_error', handleEvent('server_error')),
    )

    return () => {
      logger.debug('Cleaning up event listeners')
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  return (
    <EventContext.Provider value={{ connected, lastEvent }}>
      {mounted && <EventBridge />}
      {children}
    </EventContext.Provider>
  )
}
