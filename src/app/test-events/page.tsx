'use client'

import { useState, useEffect } from 'react'
import { EVENTS } from '@/constants/events'
import { eventBus } from '@/utilities/eventBus'

export default function TestEvents() {
  const [events, setEvents] = useState<Array<{ type: string; data: any; timestamp: string }>>([])
  const [selectedEvent, setSelectedEvent] = useState('video:created')
  const [testData, setTestData] = useState('{"id":"test-123","title":"Test Video"}')
  const [status, setStatus] = useState('')

  useEffect(() => {
    // Subscribe to all events
    const unsubscribes = Object.values(EVENTS).map(eventName => {
      return eventBus.on(eventName, (data: any) => {
        console.log(`Received ${eventName} event:`, data)
        setEvents(prev => [
          {
            type: eventName,
            data,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 19) // Keep last 20 events
        ])
        setStatus(`Received ${eventName} event at ${new Date().toLocaleTimeString()}`)
      })
    })
    
    // Add subscription for server_connected event
    unsubscribes.push(
      eventBus.on('server_connected', (data: any) => {
        console.log('Received server_connected event:', data)
        setEvents(prev => [
          {
            type: 'server_connected',
            data,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 19)
        ])
        setStatus(`Connected to server at ${new Date().toLocaleTimeString()}`)
      })
    )
    
    return () => {
      // Unsubscribe from all events
      unsubscribes.forEach(unsubscribe => unsubscribe())
    }
  }, [])
  
  const emitTestEvent = async () => {
    try {
      setStatus('Emitting test event...')
      const response = await fetch('/api/debug/emit-test-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: selectedEvent,
          data: JSON.parse(testData)
        })
      })
      
      const result = await response.json()
      console.log('Emit test event result:', result)
      setStatus(`Emitted test event: ${selectedEvent} at ${new Date().toLocaleTimeString()}`)
    } catch (error) {
      console.error('Error emitting test event:', error)
      setStatus(`Error emitting test event: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  const emitLocalEvent = () => {
    try {
      const data = JSON.parse(testData)
      console.log(`Emitting local event: ${selectedEvent}`, data)
      eventBus.emit(selectedEvent, data)
      setStatus(`Emitted local event: ${selectedEvent} at ${new Date().toLocaleTimeString()}`)
    } catch (error) {
      console.error('Error emitting local event:', error)
      setStatus(`Error emitting local event: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Event System Test Page</h1>
      
      <div className="mb-4 p-2 border rounded">
        <div className="text-sm text-gray-600">{status || 'Ready'}</div>
      </div>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Test Events</h2>
        <div className="mb-2">
          <label className="block text-sm mb-1">Event Type:</label>
          <select 
            className="w-full p-2 border rounded"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            {Object.values(EVENTS).map(event => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="block text-sm mb-1">Event Data (JSON):</label>
          <textarea 
            className="w-full p-2 border rounded font-mono text-sm"
            rows={5}
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
          />
        </div>
        <div className="flex space-x-4">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={emitTestEvent}
          >
            Emit Server Event
          </button>
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={emitLocalEvent}
          >
            Emit Local Event
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Event Log</h2>
        <div className="border rounded overflow-hidden">
          {events.length === 0 ? (
            <div className="p-4 text-gray-500">No events received yet</div>
          ) : (
            <div className="divide-y">
              {events.map((event, index) => (
                <div key={index} className="p-3">
                  <div className="font-semibold">{event.type}</div>
                  <div className="text-xs text-gray-500">{event.timestamp}</div>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
