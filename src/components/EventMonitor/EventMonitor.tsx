'use client'

// src\components\EventMonitor\EventMonitor.tsx
import React, { useEffect, useState } from 'react'
import { useEventBusMulti } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

interface EventLog {
  id: string
  type: string
  data: any
  timestamp: string
}

export const EventMonitor: React.FC = () => {
  const [events, setEvents] = useState<EventLog[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const addEvent = (type: string, data: any) => {
    console.log(`📝 EventMonitor received ${type}:`, data)
    setEvents((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        data,
        timestamp: new Date().toISOString(),
      },
      ...prev.slice(0, 99), // Keep last 100 events
    ])
  }

  // Subscribe to all relevant events
  useEventBusMulti(
    Object.entries(EVENTS).reduce(
      (acc, [_, eventName]) => ({
        ...acc,
        [eventName]: (data: any) => addEvent(eventName, data),
      }),
      {},
    ),
  )

  if (!isExpanded) {
    return (
      <button
        className="fixed bottom-4 left-4 bg-blue-500 text-white p-2 rounded"
        onClick={() => setIsExpanded(true)}
      >
        Show Event Monitor ({events.length})
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      <div className="p-2 bg-blue-500 text-white flex justify-between items-center">
        <h3>Event Monitor</h3>
        <button onClick={() => setIsExpanded(false)}>Minimize</button>
      </div>
      <div className="p-2 h-full overflow-auto">
        {events.map((event) => (
          <div key={event.id} className="mb-2 p-2 border-b border-gray-200">
            <div className="font-bold text-sm">{event.type}</div>
            <div className="text-xs text-gray-500">{event.timestamp}</div>
            <pre className="text-xs mt-1 bg-gray-50 p-1 rounded">
              {JSON.stringify(event.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventMonitor
