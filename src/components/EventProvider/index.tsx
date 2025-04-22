'use client'

import { clientLogger } from '@/utils/clientLogger'

//src\components\EventProvider\index.tsx

import { useEffect, useState } from 'react'
import EventBridge from '@/components/EventProvider/EventBridge'
import { eventBus, EVENTS } from '@/utilities/eventBus'
import { EventContext } from './EventContext'

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState<boolean>(false)
  const [lastEvent, setLastEvent] = useState<{ type: string; data: any } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    const unsubscribe = eventBus.on('server_connected', () => {
      clientLogger.info('Server connected event received', 'EventProviderindex')
      setConnected(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const handleEvent = (type: string) => (data: any) => {
      clientLogger.info(`Event received: ${type}`, 'EventProviderindex', { eventData: data })
      setLastEvent({ type, data })
    }

    const unsubscribes = Object.values(EVENTS).map((event) => {
      return eventBus.on(event, handleEvent(event))
    })

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
      {mounted && <EventBridge />}
      {children}
    </EventContext.Provider>
  )
}
