'use client'

/**
 * Event Provider Component
 *
 * Sets up the event system for the application
 */

import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { EventBridge } from '@/components/EventBridge'
import { eventBus, EVENTS } from '@/utilities/eventBus'

// Context for the event system
interface EventContextType {
  connected: boolean
  lastEvent: { type: string; data: any } | null
}

const EventContext = createContext<EventContextType>({
  connected: false,
  lastEvent: null,
})

// Hook for using the event context
export function useEventContext(): EventContextType {
  return useContext(EventContext)
}

interface EventProviderProps {
  children: ReactNode
}

/**
 * Provider component that sets up the event system
 */
export function EventProvider({ children }: EventProviderProps) {
  const [connected, setConnected] = useState<boolean>(false)
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null)

  // Listen for connection events
  useEffect(() => {
    const unsubscribe = eventBus.on('server_connected', () => {
      setConnected(true)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Listen for all events to update the last event
  useEffect(() => {
    const handleEvent = (type: string) => (data: any) => {
      setLastEvent({ type, data })
    }

    // Subscribe to all events defined in EVENTS
    const unsubscribes = Object.values(EVENTS).map((event) => {
      return eventBus.on(event, handleEvent(event))
    })

    // Also subscribe to server communication events
    unsubscribes.push(
      eventBus.on('server_connected', handleEvent('server_connected')),
      eventBus.on('server_error', handleEvent('server_error')),
    )

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  return (
    <EventContext.Provider value={{ connected, lastEvent }}>
      <EventBridge />
      {children}
    </EventContext.Provider>
  )
}

