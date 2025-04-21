// src\components\EventProvider\EventBridge.tsx

import { useEffect } from 'react'
import { eventBus } from '@/utilities/eventBus'
import { EVENTS } from '@/constants/events'

const EventBridge: React.FC = () => {
  useEffect(() => {
    const eventSource = new EventSource('/api/events')

    // Helper to forward and log events
    const forwardEvent = (eventName: string) => (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log(`[EventBridge] Forwarding event: ${eventName}`, data)
        eventBus.emit(eventName, data)
      } catch (err) {
        console.error(`[EventBridge] Error parsing event data for ${eventName}:`, err)
      }
    }

    // Forward all events in EVENTS
    Object.values(EVENTS).forEach((eventName) => {
      eventSource.addEventListener(eventName, forwardEvent(eventName))
    })

    Object.values(EVENTS).forEach((eventName) => {
      eventSource.addEventListener(eventName, (event: MessageEvent) => {
        console.log(`[EventBridge] SSE received: ${eventName}`, event.data)
        try {
          const data = JSON.parse(event.data)
          eventBus.emit(eventName, data)
        } catch (err) {
          console.error(`[EventBridge] Error parsing event data for ${eventName}:`, err)
        }
      })
    })

    // Optionally: catch any custom events not in EVENTS
    eventSource.addEventListener('video:status:ready', forwardEvent('video:status:ready'))

    return () => {
      eventSource.close()
    }
  }, [])

  return null
}

export default EventBridge
