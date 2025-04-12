'use client'

import { useEffect } from 'react'
import { useEventSource } from '@/hooks/useEventSource'
import { eventBus, EVENTS } from '@/utilities/eventBus'
import { API_ROUTES } from '@/constants/api'

export function EventBridge(): null {
  const { connected, error } = useEventSource({
    url: API_ROUTES.EVENTS,
    events: {
      [EVENTS.VIDEO_CREATED]: (data) => {
        console.log('Received video_created event from server:', data)
        eventBus.emit(EVENTS.VIDEO_CREATED, data)
      },
      [EVENTS.VIDEO_UPDATED]: (data) => {
        console.log('Received video_updated event from server:', data)
        eventBus.emit(EVENTS.VIDEO_UPDATED, data)
      },
    },
    onOpen: () => {
      console.log('EventSource connected')
      eventBus.emit('server_connected')
    },
    onError: (error) => {
      console.error('EventSource error:', error)
      eventBus.emit('server_error', error)
    },
  })

  // Log connection status changes
  useEffect(() => {
    console.log('EventBridge connection status:', connected ? 'connected' : 'disconnected')
  }, [connected])

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('EventBridge error:', error)
    }
  }, [error])

  return null
}

