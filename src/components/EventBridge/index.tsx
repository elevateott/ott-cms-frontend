'use client'

import { useEffect, useRef } from 'react'
import { useEventSource } from '@/hooks/useEventSource'
import { eventBus, EVENTS } from '@/utilities/eventBus'
import { API_ROUTES } from '@/constants/api'
import { EVENTS as CONST_EVENTS } from '@/constants/events'

export function EventBridge(): null {
  const eventCountRef = useRef<Record<string, number>>({
    [EVENTS.VIDEO_CREATED]: 0,
    [EVENTS.VIDEO_UPDATED]: 0,
  })

  const { connected, error } = useEventSource({
    url: API_ROUTES.EVENTS,
    events: {
      [CONST_EVENTS.VIDEO_CREATED]: (data) => {
        const count = eventCountRef.current[EVENTS.VIDEO_CREATED] + 1
        eventCountRef.current[EVENTS.VIDEO_CREATED] = count
        console.log(`Received video_created event from server (${count}):`, data)
        console.log('Emitting to event bus:', EVENTS.VIDEO_CREATED)
        eventBus.emit(EVENTS.VIDEO_CREATED, data)
      },
      [CONST_EVENTS.VIDEO_UPDATED]: (data) => {
        const count = eventCountRef.current[EVENTS.VIDEO_UPDATED] + 1
        eventCountRef.current[EVENTS.VIDEO_UPDATED] = count
        console.log(`Received video_updated event from server (${count}):`, data)
        console.log('Emitting to event bus:', EVENTS.VIDEO_UPDATED)
        eventBus.emit(EVENTS.VIDEO_UPDATED, data)
      },
      // Add a special handler for status updates
      'video:status:updated': (data) => {
        console.log('Received video:status:updated event from server:', data)
        console.log('Checking if we need to reload the page for video:', data.id)

        // If this is a status change, fetch the video to check its status
        if (data && data.id) {
          fetch(`/api/videos/${data.id}`)
            .then((response) => response.json())
            .then((videoData) => {
              if (videoData && videoData.muxData && videoData.muxData.status === 'ready') {
                console.log('Video status is ready, reloading the page in 2 seconds')
                setTimeout(() => {
                  console.log('Reloading page now')
                  window.location.reload()
                }, 2000)
              }
            })
            .catch((err) => console.error('Error fetching video data:', err))
        }
      },

      // Add a direct reload handler
      'reload:page': (data) => {
        console.log('Received reload:page event from server:', data)
        console.log('Reloading page in 2 seconds')
        setTimeout(() => {
          console.log('Reloading page now')
          window.location.reload()
        }, 2000)
      },

      // Add a special handler for status ready events
      'video:status:ready': (data) => {
        console.log('Received video:status:ready event from server:', data)
        console.log('Video status is ready, reloading the page in 2 seconds')
        setTimeout(() => {
          console.log('Reloading page now')
          window.location.reload()
        }, 2000)
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
