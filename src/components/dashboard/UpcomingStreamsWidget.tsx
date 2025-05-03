'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clientLogger } from '@/utils/clientLogger'
import { formatDate } from '@/utilities/formatDate'
import { CalendarClock } from 'lucide-react'

const logger = clientLogger.createContextLogger('UpcomingStreamsWidget')

interface LiveEvent {
  id: string
  title: string
  scheduledStartTime: string
  accessType: 'free' | 'subscription' | 'paid_ticket'
}

export const UpcomingStreamsWidget: React.FC = () => {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true)
      // Get current date in ISO format
      const now = new Date().toISOString()
      
      // Fetch upcoming events (scheduled after now, ordered by start time)
      const res = await fetch(`/api/live-events?where[scheduledStartTime][greater_than]=${now}&sort=scheduledStartTime&limit=5`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch upcoming streams')
      }
      
      const data = await res.json()
      setEvents(data.docs || [])
      setError(null)
    } catch (err) {
      logger.error('Error fetching upcoming streams:', err)
      setError('Failed to load upcoming streams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUpcomingEvents()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchUpcomingEvents, 30000)
    
    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [])

  // Get badge color based on access type
  const getAccessBadgeColor = (accessType: string) => {
    switch (accessType) {
      case 'free':
        return 'bg-green-100 text-green-800'
      case 'subscription':
        return 'bg-blue-100 text-blue-800'
      case 'paid_ticket':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarClock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Upcoming Streams</CardTitle>
          </div>
          {events.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
              {events.length}
            </span>
          )}
        </div>
        <CardDescription>Next 5 scheduled live events</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-4 text-center text-sm text-red-500">{error}</div>
        ) : events.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No upcoming streams scheduled</div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                <div>
                  <a 
                    href={`/admin/collections/live-events/${event.id}`}
                    className="font-medium hover:underline"
                  >
                    {event.title}
                  </a>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(event.scheduledStartTime)}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getAccessBadgeColor(event.accessType)}`}>
                  {event.accessType === 'free' ? 'Free' : 
                   event.accessType === 'subscription' ? 'Subscribers' : 
                   'Paid'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default UpcomingStreamsWidget
