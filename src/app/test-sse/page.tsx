'use client'

import { useState, useEffect } from 'react'
import { EVENTS } from '@/constants/events'

export default function TestSSE() {
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<Array<{ type: string; data: any; timestamp: string }>>([])
  const [selectedEvent, setSelectedEvent] = useState('video:created')
  const [testData, setTestData] = useState('{"id":"test-123","title":"Test Video"}')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const eventSource = new EventSource('/api/events/stream')
    
    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setConnected(true)
      setStatus('Connected to SSE stream')
    }
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error', error)
      setConnected(false)
      setStatus('Error connecting to SSE stream')
    }
    
    // Listen for all events
    Object.values(EVENTS).forEach(eventName => {
      eventSource.addEventListener(eventName, (event) => {
        try {
          const data = JSON.parse(event.data)
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
        } catch (err) {
          console.error(`Error parsing ${eventName} event data:`, err)
        }
      })
    })
    
    // Listen for connected event
    eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Received connected event:', data)
        setEvents(prev => [
          {
            type: 'connected',
            data,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 19)
        ])
        setStatus(`Connected to SSE stream with ID: ${data.connectionId}`)
      } catch (err) {
        console.error('Error parsing connected event data:', err)
      }
    })
    
    // Listen for ping events
    eventSource.addEventListener('ping', (event) => {
      console.log('Received ping event:', event.data)
      setStatus(`Received ping at ${new Date().toLocaleTimeString()}`)
    })
    
    return () => {
      console.log('Closing SSE connection')
      eventSource.close()
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
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">SSE Test Page</h1>
      
      <div className="mb-4 p-2 border rounded">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">{status}</div>
      </div>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Emit Test Event</h2>
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
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={emitTestEvent}
        >
          Emit Event
        </button>
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
