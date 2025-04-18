/**
 * useEventSource Hook
 *
 * A custom hook for using Server-Sent Events (EventSource) with React
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { UseEventSourceOptions, UseEventSourceResult } from '@/types/hooks'
import { API_ROUTES } from '@/constants/api'

/**
 * Hook for connecting to a server-sent events endpoint
 */
export function useEventSource(
  options: UseEventSourceOptions = {
    url: API_ROUTES.EVENTS,
    events: {},
  },
): UseEventSourceResult {
  const { url = API_ROUTES.EVENTS, events = {}, onOpen, onError } = options
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // If we already have a connection, don't create a new one
    if (eventSourceRef.current) {
      console.log('🔌 EventSource: Connection already exists, skipping initialization')
      return
    }

    console.log('🔌 EventSource: Initializing connection to:', url)
    console.log('🔌 EventSource: Registering event handlers for:', Object.keys(events))

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('🔌 EventSource: Connection opened')
      setConnected(true)
      if (onOpen) onOpen()
    }

    eventSource.onerror = (error) => {
      console.error('🔌 EventSource: Connection error:', error)
      setConnected(false)
      if (onError) onError(error)
    }

    // Register event handlers
    Object.entries(events).forEach(([eventName, handler]) => {
      console.log(`🔌 EventSource: Adding listener for event: ${eventName}`)

      eventSource.addEventListener(eventName, (event: MessageEvent) => {
        console.log(`🔌 EventSource: Received event: ${eventName}`, event.data)
        try {
          const data = event.data ? JSON.parse(event.data) : {}
          handler(data)
        } catch (error) {
          console.error(`🔌 EventSource: Error handling event ${eventName}:`, error)
          handler(event.data)
        }
      })
    })

    return () => {
      console.log('🔌 EventSource: Cleaning up connection')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setConnected(false)
    }
  }, []) // Empty dependency array - only run once on mount

  return { connected }
}


