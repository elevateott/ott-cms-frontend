'use client'

import { useState, useEffect } from 'react'
import { EVENTS } from '@/constants/events'

export default function TestSSEConnection() {
  const [connected, setConnected] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [events, setEvents] = useState<Array<{ type: string; data: any; timestamp: string }>>([])
  const [selectedEvent, setSelectedEvent] = useState('video:created')
  const [status, setStatus] = useState('Initializing...')

  useEffect(() => {
    setStatus('Connecting to SSE stream...')
    
    // Create EventSource connection
    const eventSource = new EventSource('/api/events/stream')
    
    // Handle connection open
    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setStatus('SSE connection established')
    }
    
    // Handle connection error
    eventSource.onerror = (error) => {
      console.error('SSE connection error', error)
      setStatus('Error connecting to SSE stream')
      setConnected(false)
    }
    
    // Handle connected event
    eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('Received connected event:', data)
        setConnectionId(data.connectionId)
        setConnected(true)
        setStatus(`Connected to SSE stream with ID: ${data.connectionId}`)
        
        // Add to events list
        setEvents(prev => [
          {
            type: 'connected',
            data,
            timestamp: new Date().toISOString()
          },
          ...prev.slice(0, 19) // Keep last 20 events
        ])
      } catch (err) {
        console.error('Error parsing connected event data:', err)
      }
    })
    
    // Handle ping events
    eventSource.addEventListener('ping', (event) => {
      console.log('Received ping event:', event.data)
      setStatus(`Last ping: ${new Date().toLocaleTimeString()}`)
    })
    
    // Register listeners for all events
    Object.values(EVENTS).forEach(eventName => {
      eventSource.addEventListener(eventName, (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log(`Received ${eventName} event:`, data)
          
          // Add to events list
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
    
    // Cleanup on unmount
    return () => {
      console.log('Closing SSE connection')
      eventSource.close()
    }
  }, [])
  
  const testEvent = async () => {
    try {
      setStatus(`Testing event: ${selectedEvent}...`)
      const response = await fetch(`/api/debug/test-sse?event=${selectedEvent}`)
      const result = await response.json()
      console.log('Test event result:', result)
      setStatus(`Sent test event: ${selectedEvent} to ${result.clientCount} clients`)
    } catch (error) {
      console.error('Error testing event:', error)
      setStatus(`Error testing event: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">SSE Connection Test</h1>
      
      <div className="mb-6 p-4 border rounded">
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-semibold">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {connectionId && (
          <div className="text-sm text-gray-600 mb-2">Connection ID: {connectionId}</div>
        )}
        <div className="text-sm text-gray-600">{status}</div>
      </div>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Test Event</h2>
        <div className="mb-4">
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
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={testEvent}
        >
          Test Event
        </button>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Event Log</h2>
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
