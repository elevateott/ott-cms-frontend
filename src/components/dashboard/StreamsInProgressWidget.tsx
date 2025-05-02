'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clientLogger } from '@/utils/clientLogger'
import { formatDate } from '@/utilities/formatDate'
import { Radio, AlertCircle } from 'lucide-react'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

const logger = clientLogger.createContextLogger('StreamsInProgressWidget')

interface LiveEvent {
  id: string
  title: string
  startedAt: string
  muxStatus: 'active' | 'idle' | 'disconnected' | 'completed'
  viewerCount?: number
}

export const StreamsInProgressWidget: React.FC = () => {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveStreams = async () => {
    try {
      setLoading(true)
      
      // Fetch active streams (muxStatus = active or disconnected)
      const res = await fetch(`/api/live-events?where[muxStatus][in]=active,disconnected&sort=-startedAt&limit=5`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch active streams')
      }
      
      const data = await res.json()
      setEvents(data.docs || [])
      setError(null)
    } catch (err) {
      logger.error('Error fetching active streams:', err)
      setError('Failed to load active streams')
    } finally {
      setLoading(false)
    }
  }

  // Listen for live stream status updates via event bus
  useEventBusOn(
    EVENTS.LIVE_STREAM_STATUS_CHANGED,
    () => {
      fetchActiveStreams()
    },
    [],
  )

  useEffect(() => {
    fetchActiveStreams()
    
    // Set up auto-refresh every 15 seconds (more frequent for active streams)
    const interval = setInterval(fetchActiveStreams, 15000)
    
    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [])

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'disconnected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate if any stream is disconnected
  const hasDisconnectedStreams = events.some(event => event.muxStatus === 'disconnected')

  return (
    <Card className={hasDisconnectedStreams ? 'border-red-500' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className={`h-5 w-5 ${hasDisconnectedStreams ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
            <CardTitle>Streams In Progress</CardTitle>
          </div>
          {events.length > 0 && (
            <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white rounded-full ${hasDisconnectedStreams ? 'bg-red-500' : 'bg-green-500'}`}>
              {events.length}
            </span>
          )}
        </div>
        <CardDescription>Currently active live streams</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-4 text-center text-sm text-red-500">{error}</div>
        ) : events.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No active streams</div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                <div>
                  <div className="flex items-center space-x-2">
                    <a 
                      href={`/admin/collections/live-events/${event.id}`}
                      className="font-medium hover:underline"
                    >
                      {event.title}
                    </a>
                    {event.muxStatus === 'disconnected' && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Started: {formatDate(event.startedAt)}
                  </div>
                  
                  {/* Progress bar for stream duration */}
                  {event.startedAt && (
                    <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${event.muxStatus === 'active' ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ 
                          width: `${Math.min(100, ((Date.now() - new Date(event.startedAt).getTime()) / (3600000)) * 100)}%` 
                        }}
                      />
                    </div>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(event.muxStatus)}`}>
                  {event.muxStatus === 'active' ? 'Live' : 'Disconnected'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default StreamsInProgressWidget
