'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { Skeleton } from '@/components/ui/skeleton'

const logger = clientLogger.createContextLogger('HealthStatsTest')

interface HealthStats {
  stream_health?: 'healthy' | 'degraded' | 'failed'
  video_bitrate?: number
  video_frame_rate?: number
  video_codec?: string
  video_resolution?: string
  audio_bitrate?: number
  last_seen_time?: string
  errors?: Array<{ message: string; code?: string }>
  status?: string
}

export default function HealthStatsTest() {
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [healthData, setHealthData] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [healthLoading, setHealthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch live events
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/live-events')
        if (!response.ok) {
          throw new Error('Failed to fetch live events')
        }

        const data = await response.json()
        setLiveEvents(data.docs || [])
      } catch (error) {
        logger.error('Error fetching live events:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLiveEvents()
  }, [])

  // Fetch health stats for the selected event
  const fetchHealthStats = async () => {
    if (!selectedEvent) return

    try {
      setHealthLoading(true)
      setHealthError(null)

      const response = await fetch(`/api/live-events/${selectedEvent.id}/health-stats`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch health stats')
      }

      const data = await response.json()
      setHealthData(data)
      setLastUpdated(new Date())
    } catch (error) {
      logger.error('Error fetching health stats:', error)
      setHealthError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setHealthLoading(false)
    }
  }

  // Set up auto-refresh
  useEffect(() => {
    if (selectedEvent && autoRefresh) {
      // Fetch health stats immediately
      fetchHealthStats()

      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchHealthStats, 30000)
      setRefreshInterval(interval)

      // Clean up the interval when the component unmounts or when the selected event changes
      return () => {
        if (refreshInterval) {
          clearInterval(refreshInterval)
          setRefreshInterval(null)
        }
      }
    }
  }, [selectedEvent, autoRefresh])

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event)
    setHealthData(null)
    setHealthError(null)
    setLastUpdated(null)

    // Clear the existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
    
    // Clear the existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    }
  }

  // Get the health status color
  const getHealthColor = (health?: string) => {
    if (!health) return 'gray'

    switch (health) {
      case 'healthy':
        return 'green'
      case 'degraded':
        return 'yellow'
      case 'failed':
        return 'red'
      default:
        return 'gray'
    }
  }

  // Get the status color
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'gray'

    switch (status) {
      case 'active':
        return 'green'
      case 'idle':
        return 'blue'
      case 'disconnected':
        return 'yellow'
      case 'completed':
        return 'gray'
      case 'disabled':
        return 'amber'
      default:
        return 'gray'
    }
  }

  const healthColor = getHealthColor(healthData?.stream_health)
  const isHealthCritical = healthData?.stream_health === 'failed'
  const isHealthDegraded = healthData?.stream_health === 'degraded'
  const hasErrors = healthData?.errors && healthData.errors.length > 0

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Live Stream Health Stats</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Live Events</CardTitle>
              <CardDescription>Select a live event to view health stats</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : liveEvents.length === 0 ? (
                <p className="text-gray-500">No live events found</p>
              ) : (
                <div className="space-y-2">
                  {liveEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedEvent?.id === event.id
                          ? 'bg-blue-100 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectEvent(event)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{event.title}</h3>
                        {event.muxStatus && (
                          <Badge
                            className={`bg-${getStatusColor(event.muxStatus)}-500 hover:bg-${getStatusColor(
                              event.muxStatus,
                            )}-600`}
                          >
                            {event.muxStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedEvent ? (
            <Card>
              {isHealthCritical && (
                <Alert variant="destructive" className="m-4 animate-pulse">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Critical: Stream has FAILED</AlertTitle>
                  <AlertDescription>Immediate attention required!</AlertDescription>
                </Alert>
              )}

              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {selectedEvent.title}
                    <Badge
                      className={`ml-2 bg-${getStatusColor(selectedEvent.muxStatus)}-500 hover:bg-${getStatusColor(
                        selectedEvent.muxStatus,
                      )}-600`}
                    >
                      {selectedEvent.muxStatus}
                    </Badge>
                  </CardTitle>
                  {healthData?.stream_health && (
                    <Badge
                      className={`bg-${healthColor}-500 hover:bg-${healthColor}-600 transition-colors duration-300 ${
                        (isHealthCritical || isHealthDegraded) ? 'animate-pulse' : ''
                      }`}
                    >
                      {healthData.stream_health.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <CardDescription>Live Stream Health Stats</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchHealthStats}
                    disabled={healthLoading}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
                    Refresh Now
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Auto-refresh:</span>
                    <Button
                      variant={autoRefresh ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleAutoRefresh}
                    >
                      {autoRefresh ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>

                {healthError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{healthError}</AlertDescription>
                  </Alert>
                )}

                {healthLoading && !healthData ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : healthData ? (
                  <div className="space-y-4">
                    {hasErrors && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Health Warnings</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-5 mt-2">
                            {healthData.errors?.map((error, index) => (
                              <li key={index}>{error.message}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Video Bitrate</p>
                        <p className="text-sm">
                          {healthData.video_bitrate ? `${healthData.video_bitrate} kbps` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Video Frame Rate</p>
                        <p className="text-sm">
                          {healthData.video_frame_rate ? `${healthData.video_frame_rate} fps` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Video Codec</p>
                        <p className="text-sm">{healthData.video_codec || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Video Resolution</p>
                        <p className="text-sm">{healthData.video_resolution || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Audio Bitrate</p>
                        <p className="text-sm">
                          {healthData.audio_bitrate ? `${healthData.audio_bitrate} kbps` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Seen</p>
                        <p className="text-sm">
                          {healthData.last_seen_time
                            ? new Date(healthData.last_seen_time).toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Select a live event and click Refresh to view health stats</p>
                )}

                {lastUpdated && (
                  <div className="text-xs text-gray-500 mt-4">
                    Last updated: {lastUpdated.toLocaleString()}
                    {autoRefresh && ' (auto-refreshes every 30 seconds)'}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Select a live event to view health stats</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
