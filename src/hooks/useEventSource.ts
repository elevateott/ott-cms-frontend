/**
 * useEventSource Hook
 *
 * A custom hook for using Server-Sent Events (EventSource) with React
 */

import { useEffect, useRef, useState, useCallback } from 'react'

interface EventSourceProps {
  url: string
  events: { [key: string]: (data: any) => void }
  onOpen?: () => void
  onError?: (error: Event) => void
}

/**
 * Hook for connecting to a server-sent events endpoint
 */
export function useEventSource({ url, events, onOpen, onError }: EventSourceProps) {
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const lastConnectionAttemptRef = useRef(0)
  const MINIMUM_RECONNECT_DELAY = 2000 // Minimum 2 seconds between reconnection attempts
  const MAX_RECONNECT_ATTEMPTS = 5
  const INITIAL_RETRY_DELAY = 1000
  const MAX_RETRY_DELAY = 30000

  const connect = useCallback(() => {
    const now = Date.now()
    if (now - lastConnectionAttemptRef.current < MINIMUM_RECONNECT_DELAY) {
      console.log('Throttling connection attempt...')
      return
    }
    lastConnectionAttemptRef.current = now

    // Don't create a new connection if we already have one
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    try {
      // Clean up existing connection if it exists
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      console.log('Creating new EventSource connection...')
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      // Connection opened
      eventSource.onopen = () => {
        console.log('SSE Connection opened')
        setConnected(true)
        reconnectAttemptsRef.current = 0
        if (onOpen) onOpen()
      }

      // Handle errors
      eventSource.onerror = (error) => {
        console.log('SSE Connection error:', error)

        if (eventSource.readyState === EventSource.CLOSED) {
          setConnected(false)
          if (onError) onError(error)

          // Don't attempt to reconnect if we got a 503
          if ((error as any).status === 503) {
            console.log('Too many connections, waiting longer before retry...')
            const backoffTime = INITIAL_RETRY_DELAY * 2
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current)
            }
            reconnectTimeoutRef.current = setTimeout(connect, backoffTime)
            return
          }

          // Attempt reconnection if under max attempts
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const backoffTime = Math.min(
              INITIAL_RETRY_DELAY * Math.pow(2, reconnectAttemptsRef.current),
              MAX_RETRY_DELAY
            )
            console.log(`Attempting reconnect in ${backoffTime}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`)

            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current)
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++
              connect()
            }, backoffTime)
          }
        }
      }

      // Register event handlers
      Object.entries(events).forEach(([eventName, handler]) => {
        eventSource.addEventListener(eventName, (event: MessageEvent) => {
          try {
            const data = event.data ? JSON.parse(event.data) : {}
            handler(data)
          } catch (error) {
            console.error(`Error handling ${eventName} event:`, error)
            handler(event.data)
          }
        })
      })

    } catch (error) {
      console.error('Error creating EventSource:', error)
      if (onError) onError(error as Event)
    }
  }, [url, events, onOpen, onError])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        console.log('Closing EventSource connection...')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [connect])

  return { connected }
}








