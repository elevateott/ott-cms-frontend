'use client'

import { useState } from 'react'
import { EVENTS } from '@/constants/events'
import EventMonitor from '@/components/EventMonitor/EventMonitor'
import ListViewRefresher from '@/collections/VideoAssets/components/ListViewRefresher'

export default function TestListRefresher() {
  const [selectedEvent, setSelectedEvent] = useState('video:created')
  const [customId, setCustomId] = useState(`test-${Date.now()}`)
  const [customTitle, setCustomTitle] = useState('Test Video')
  const [status, setStatus] = useState('Ready to test')

  const testEvent = async () => {
    try {
      setStatus(`Testing event: ${selectedEvent}...`)
      const response = await fetch(`/api/debug/emit-test-event?event=${selectedEvent}&id=${customId}&title=${encodeURIComponent(customTitle)}`)
      const result = await response.json()
      console.log('Test event result:', result)
      setStatus(`Sent test event: ${selectedEvent} to ${result.clientCount} clients`)
    } catch (error) {
      console.error('Error testing event:', error)
      setStatus(`Error testing event: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const testCustomEvent = async () => {
    try {
      setStatus(`Testing custom event: ${selectedEvent}...`)
      const response = await fetch('/api/debug/emit-test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: selectedEvent,
          data: { 
            id: customId, 
            title: customTitle,
            status: 'ready',
            isStatusChange: true,
            customField: 'This is a custom field'
          }
        })
      })
      const result = await response.json()
      console.log('Custom test event result:', result)
      setStatus(`Sent custom test event: ${selectedEvent} to ${result.clientCount} clients`)
    } catch (error) {
      console.error('Error testing custom event:', error)
      setStatus(`Error testing custom event: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">ListViewRefresher Test</h1>
      
      <div className="mb-6 p-4 border rounded">
        <div className="text-sm text-gray-600 mb-4">{status}</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
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
          
          <div>
            <label className="block text-sm mb-1">Custom ID:</label>
            <input 
              type="text"
              className="w-full p-2 border rounded"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm mb-1">Custom Title:</label>
          <input 
            type="text"
            className="w-full p-2 border rounded"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-4">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={testEvent}
          >
            Test Simple Event
          </button>
          
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={testCustomEvent}
          >
            Test Status Change Event
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Select an event type from the dropdown</li>
          <li>Customize the ID and title if desired</li>
          <li>Click "Test Simple Event" to emit a basic event</li>
          <li>Click "Test Status Change Event" to emit an event with isStatusChange=true</li>
          <li>Watch both the EventMonitor (bottom-left) and ListViewRefresher (bottom-right)</li>
          <li>Check the browser console and server logs for detailed logging</li>
        </ol>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">What to Look For</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>EventMonitor should display all events in the bottom-left corner</li>
          <li>ListViewRefresher should show "Last refreshed" timestamp updates</li>
          <li>ListViewRefresher should show "Events" count increasing</li>
          <li>For video:created and video:upload:completed events, ListViewRefresher should show "Polling active"</li>
          <li>For video:status:ready events, ListViewRefresher should stop polling</li>
        </ul>
      </div>
      
      {/* Include both components for testing */}
      <EventMonitor />
      <ListViewRefresher />
    </div>
  )
}
