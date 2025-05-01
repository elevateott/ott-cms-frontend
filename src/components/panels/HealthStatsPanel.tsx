'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from 'payload/components/forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { Skeleton } from '@/components/ui/skeleton'

const logger = clientLogger.createContextLogger('HealthStatsPanel')

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

export const HealthStatsPanel: React.FC = () => {
  const { document, id } = useDocumentInfo()
  const [healthData, setHealthData] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const fetchHealthStats = async () => {
    try {
      if (!document?.muxLiveStreamId) {
        setLoading(false)
        return
      }

      const response = await fetch(`/api/live-events/${id}/health-stats`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch health stats')
      }

      const data = await response.json()
      setHealthData(data)
      setError(null)
    } catch (error) {
      logger.error('Error fetching health stats:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch health stats when the component mounts
    fetchHealthStats()

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthStats, 30000)
    setRefreshInterval(interval)

    // Clean up the interval when the component unmounts
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [id])

  // If there's no Mux live stream, don't show the panel
  if (!document?.muxLiveStreamId) {
    return null
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

  const healthColor = getHealthColor(healthData?.stream_health)
  const isHealthCritical = healthData?.stream_health === 'failed'
  const isHealthDegraded = healthData?.stream_health === 'degraded'
  const hasErrors = healthData?.errors && healthData.errors.length > 0

  return (
    <Card className="mb-6">
      {isHealthCritical && (
        <Alert variant="destructive" className="mb-4 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical: Stream has FAILED</AlertTitle>
          <AlertDescription>Immediate attention required!</AlertDescription>
        </Alert>
      )}

      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Health Stats</CardTitle>
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
        <CardDescription>Live stream health monitoring</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {hasErrors && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Health Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2">
                    {healthData?.errors?.map((error, index) => (
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
                  {healthData?.video_bitrate ? `${healthData.video_bitrate} kbps` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Video Frame Rate</p>
                <p className="text-sm">
                  {healthData?.video_frame_rate ? `${healthData.video_frame_rate} fps` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Video Codec</p>
                <p className="text-sm">{healthData?.video_codec || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Video Resolution</p>
                <p className="text-sm">{healthData?.video_resolution || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Audio Bitrate</p>
                <p className="text-sm">
                  {healthData?.audio_bitrate ? `${healthData.audio_bitrate} kbps` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Seen</p>
                <p className="text-sm">
                  {healthData?.last_seen_time
                    ? new Date(healthData.last_seen_time).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              Auto-refreshes every 30 seconds. Last updated:{' '}
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default HealthStatsPanel
