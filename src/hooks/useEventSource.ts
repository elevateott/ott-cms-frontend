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

  const [connected, setConnected] = useState<boolean>(false)
  const [error, setError] = useState<Event | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const mountedRef = useRef<boolean>(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      if (eventSourceRef.current?.readyState === EventSource.OPEN) {
        return
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        if (!mountedRef.current) {
          eventSource.close()
          return
        }

        console.log('EventSource connected')
        setConnected(true)
        setError(null)
        if (onOpen) onOpen()

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = undefined
        }
      }

      eventSource.onerror = (event) => {
        if (!mountedRef.current) return

        console.error('EventSource error:', event)
        setError(event)
        setConnected(false)
        if (onError) onError(event)

        eventSource.close()
        eventSourceRef.current = null

        if (!reconnectTimeoutRef.current && mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              reconnectTimeoutRef.current = undefined
              connect()
            }
          }, 5000)
        }
      }

      Object.entries(events).forEach(([eventName, handler]) => {
        eventSource.addEventListener(eventName, (event) => {
          if (!mountedRef.current) return

          try {
            const data = event.data ? JSON.parse(event.data) : {}
            handler(data)
          } catch (error) {
            console.error(`Error handling event ${eventName}:`, error)
            handler(event.data)
          }
        })
      })

      eventSource.addEventListener('connected', () => {
        if (!mountedRef.current) return

        console.log('Received connected event from server')
        setConnected(true)
      })
    } catch (error) {
      if (!mountedRef.current) return

      console.error('Error setting up EventSource:', error)
      setError(error as Event)
      setConnected(false)
    }
  }, [url, events, onOpen, onError])

  useEffect(() => {
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        console.log('Closing EventSource connection')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [connect])

  const reconnect = useCallback(() => {
    if (!mountedRef.current) return

    console.log('Manually reconnecting to EventSource')
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    connect()
  }, [connect])

  const close = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Manually closing EventSource connection')
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setConnected(false)
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }
  }, [])

  return { connected, error, reconnect, close }
}
