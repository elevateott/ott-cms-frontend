'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clientLogger } from '@/utils/clientLogger'
import { formatDate } from '@/utilities/formatDate'
import { formatDuration } from '@/utilities/formatDuration'
import { Video } from 'lucide-react'

const logger = clientLogger.createContextLogger('RecentRecordingsWidget')

interface Recording {
  id: string
  title: string
  liveEvent: {
    id: string
    title: string
  }
  duration: number
  createdAt: string
  thumbnailUrl?: string
}

export const RecentRecordingsWidget: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentRecordings = async () => {
    try {
      setLoading(true)
      
      // Fetch recent recordings (ordered by creation date, descending)
      const res = await fetch(`/api/recordings?sort=-createdAt&limit=5`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch recent recordings')
      }
      
      const data = await res.json()
      setRecordings(data.docs || [])
      setError(null)
    } catch (err) {
      logger.error('Error fetching recent recordings:', err)
      setError('Failed to load recent recordings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentRecordings()
    
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(fetchRecentRecordings, 60000)
    
    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Recent Recordings</CardTitle>
          </div>
          {recordings.length > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-purple-500 rounded-full">
              {recordings.length}
            </span>
          )}
        </div>
        <CardDescription>Latest completed live stream recordings</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-4 text-center text-sm text-red-500">{error}</div>
        ) : recordings.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No recordings available</div>
        ) : (
          <ul className="space-y-3">
            {recordings.map((recording) => (
              <li key={recording.id} className="flex items-start space-x-3 border-b pb-2 last:border-0">
                {recording.thumbnailUrl && (
                  <div className="flex-shrink-0">
                    <img 
                      src={recording.thumbnailUrl} 
                      alt={recording.title} 
                      className="h-16 w-24 object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <a 
                    href={`/admin/collections/recordings/${recording.id}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {recording.title}
                  </a>
                  <div className="text-sm text-muted-foreground">
                    From: {recording.liveEvent?.title || 'Unknown event'}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                    <span>{formatDate(recording.createdAt)}</span>
                    {recording.duration && (
                      <span>{formatDuration(recording.duration)}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentRecordingsWidget
