import { useEffect } from 'react'
import { eventBus } from '@/utilities/eventBus'
import { EVENTS } from '@/constants/events'

const EventBridge: React.FC = () => {
  useEffect(() => {
    const eventSource = new EventSource('/api/events')

    // Forward relevant SSE events to the client-side event bus
    const forwardEvent = (eventName: string) => (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        eventBus.emit(eventName, data)
      } catch (err) {
        console.error(`Error parsing event data for ${eventName}:`, err)
      }
    }

    eventSource.addEventListener(EVENTS.VIDEO_CREATED, forwardEvent(EVENTS.VIDEO_CREATED))
    eventSource.addEventListener(EVENTS.VIDEO_UPDATED, forwardEvent(EVENTS.VIDEO_UPDATED))
    eventSource.addEventListener('video:status:ready', forwardEvent('video:status:ready'))
    eventSource.addEventListener(EVENTS.REFRESH_LIST_VIEW, forwardEvent(EVENTS.REFRESH_LIST_VIEW))

    return () => {
      eventSource.close()
    }
  }, [])

  return null // This component does not render anything
}

export default EventBridge