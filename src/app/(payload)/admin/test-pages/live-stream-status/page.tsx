'use client'

import React, { useState, useEffect } from 'react'
import { usePayloadAPI } from '@/hooks/usePayloadAPI'
import LiveStreamStatusBadge from '@/admin/components/LiveStreamStatusBadge'
import LiveStreamStatusCell from '@/admin/components/LiveStreamStatusCell'
import LiveStreamStatusLegend from '@/admin/components/LiveStreamStatusLegend'

/**
 * Test page for live stream status functionality
 */
export default function LiveStreamStatusTestPage() {
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch live events
  const { data, isLoading, isError } = usePayloadAPI('live-events', {
    limit: 10,
    sort: '-createdAt',
  })

  useEffect(() => {
    if (data?.docs) {
      setLiveEvents(data.docs)
      setLoading(false)
    }
    if (isError) {
      setError('Failed to fetch live events')
      setLoading(false)
    }
  }, [data, isError])

  // Function to refresh the status of a live event
  const refreshStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/live-events/${id}`)
      if (!response.ok) {
        throw new Error('Failed to refresh status')
      }
      const updatedEvent = await response.json()

      // Update the live event in the list
      setLiveEvents((prev) => prev.map((event) => (event.id === id ? updatedEvent : event)))
    } catch (error) {
      console.error('Error refreshing status:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Live Stream Status Test</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Status Legend</h2>
        <LiveStreamStatusLegend />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading live events...</div>
      ) : error ? (
        <div className="text-red-500 py-8">{error}</div>
      ) : liveEvents.length === 0 ? (
        <div className="text-center py-8">No live events found</div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Live Events</h2>
          <div className="grid gap-4">
            {liveEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{event.title}</h3>
                    <p className="text-sm text-gray-500">{event.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {event.muxStatus && (
                      <LiveStreamStatusCell cellData={event.muxStatus} rowData={event} />
                    )}
                    <button
                      onClick={() => refreshStatus(event.id)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Mux Live Stream ID</p>
                    <p className="text-gray-600">{event.muxLiveStreamId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Created At</p>
                    <p className="text-gray-600">
                      {event.muxCreatedAt ? new Date(event.muxCreatedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Recording Enabled</p>
                    <p className="text-gray-600">{event.isRecordingEnabled ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-gray-600">{event.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
