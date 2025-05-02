'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Activity, Clock, Video, Zap } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

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
  viewer_count?: number
  dropped_frames?: number
}

export const HealthStatsPanel: React.FC = () => {
  const { document, id } = useDocumentInfo()
  const [healthData, setHealthData] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date())
  const { toast } = useToast()
  const [previousBitrate, setPreviousBitrate] = useState<number | undefined>(undefined)

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

      // Check for critical health issues and show toast notifications
      if (data.stream_health === 'failed' && healthData?.stream_health !== 'failed') {
        toast({
          title: 'Stream Health Critical',
          description: 'Your stream has failed. Immediate attention required!',
          variant: 'destructive',
          duration: 10000, // 10 seconds
        })
      } else if (data.stream_health === 'degraded' && healthData?.stream_health !== 'degraded') {
        toast({
          title: 'Stream Health Degraded',
          description: 'Your stream quality has degraded. Check your connection.',
          variant: 'warning',
          duration: 7000, // 7 seconds
        })
      }

      // Check for low bitrate
      if (
        data.video_bitrate &&
        data.video_bitrate < 1000 &&
        data.status === 'active' &&
        (previousBitrate === undefined || previousBitrate >= 1000)
      ) {
        toast({
          title: 'Low Bitrate Detected',
          description: `Current bitrate is ${data.video_bitrate} kbps, which may result in poor video quality.`,
          variant: 'warning',
          duration: 7000, // 7 seconds
        })
      }

      // Store previous bitrate for comparison
      setPreviousBitrate(data.video_bitrate)

      setHealthData(data)
      setLastRefreshTime(new Date())
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

  // Get color for bitrate
  const getBitrateColor = (bitrate?: number) => {
    if (!bitrate) return 'gray'

    if (bitrate >= 2500) return 'green' // Excellent
    if (bitrate >= 1000) return 'yellow' // Moderate
    return 'red' // Poor
  }

  // Get color for frame rate
  const getFrameRateColor = (fps?: number) => {
    if (!fps) return 'gray'

    if (fps >= 24) return 'green' // Excellent
    if (fps >= 15) return 'yellow' // Moderate
    return 'red' // Poor
  }

  // Format time since last seen
  const formatTimeSince = (dateString?: string) => {
    if (!dateString) return 'Never'

    const lastSeen = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - lastSeen.getTime()

    // If less than a minute, show seconds
    if (diffMs < 60000) {
      const seconds = Math.floor(diffMs / 1000)
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`
    }

    // If less than an hour, show minutes
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000)
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    }

    // Otherwise show hours
    const hours = Math.floor(diffMs / 3600000)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }

  const healthColor = getHealthColor(healthData?.stream_health)
  const isHealthCritical = healthData?.stream_health === 'failed'
  const isHealthDegraded = healthData?.stream_health === 'degraded'
  const isStreamActive = healthData?.status === 'active'
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
          <div className="flex items-center gap-2">
            <CardTitle>Stream Monitoring</CardTitle>
            {isStreamActive && (
              <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                </span>
                LIVE
              </div>
            )}
          </div>
          {healthData?.stream_health && (
            <Badge
              variant="outline"
              className={`
                ${healthColor === 'green' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                ${healthColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                ${healthColor === 'red' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                ${healthColor === 'gray' ? 'bg-gray-100 text-gray-800 border-gray-200' : ''}
                ${isHealthCritical || isHealthDegraded ? 'animate-pulse' : ''}
              `}
            >
              {healthData.stream_health.toUpperCase()}
            </Badge>
          )}
        </div>
        <CardDescription>Real-time stream health metrics and diagnostics</CardDescription>
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

            {/* Stream Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Stream Status</span>
              </div>
              <Badge
                variant="outline"
                className={`
                  ${healthData?.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                  ${healthData?.status === 'idle' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                  ${healthData?.status === 'disconnected' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                  ${healthData?.status === 'completed' ? 'bg-gray-100 text-gray-800 border-gray-200' : ''}
                `}
              >
                {healthData?.status ? healthData.status.toUpperCase() : 'UNKNOWN'}
              </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Video Bitrate */}
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-medium">Video Bitrate</p>
                </div>
                <p
                  className={`text-lg font-semibold ${
                    getBitrateColor(healthData?.video_bitrate) === 'green'
                      ? 'text-green-600'
                      : getBitrateColor(healthData?.video_bitrate) === 'yellow'
                        ? 'text-yellow-600'
                        : getBitrateColor(healthData?.video_bitrate) === 'red'
                          ? 'text-red-600'
                          : 'text-gray-600'
                  }`}
                >
                  {healthData?.video_bitrate
                    ? `${healthData.video_bitrate.toLocaleString()} kbps`
                    : 'N/A'}
                </p>
                {healthData?.video_bitrate && (
                  <div className="mt-1 text-xs">
                    {healthData.video_bitrate >= 2500 ? (
                      <span className="text-green-600">Excellent quality</span>
                    ) : healthData.video_bitrate >= 1000 ? (
                      <span className="text-yellow-600">Moderate quality</span>
                    ) : (
                      <span className="text-red-600">Low quality</span>
                    )}
                  </div>
                )}
              </div>

              {/* Frame Rate */}
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Video className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-medium">Frame Rate</p>
                </div>
                <p
                  className={`text-lg font-semibold ${
                    getFrameRateColor(healthData?.video_frame_rate) === 'green'
                      ? 'text-green-600'
                      : getFrameRateColor(healthData?.video_frame_rate) === 'yellow'
                        ? 'text-yellow-600'
                        : getFrameRateColor(healthData?.video_frame_rate) === 'red'
                          ? 'text-red-600'
                          : 'text-gray-600'
                  }`}
                >
                  {healthData?.video_frame_rate ? `${healthData.video_frame_rate} fps` : 'N/A'}
                </p>
                {healthData?.video_frame_rate && (
                  <div className="mt-1 text-xs">
                    {healthData.video_frame_rate >= 24 ? (
                      <span className="text-green-600">Smooth playback</span>
                    ) : healthData.video_frame_rate >= 15 ? (
                      <span className="text-yellow-600">Acceptable playback</span>
                    ) : (
                      <span className="text-red-600">Choppy playback</span>
                    )}
                  </div>
                )}
              </div>

              {/* Resolution */}
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="h-4 w-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="M3 7h18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <p className="text-sm font-medium">Resolution</p>
                </div>
                <p className="text-lg font-semibold text-gray-600">
                  {healthData?.video_resolution || 'N/A'}
                </p>
                {healthData?.video_resolution && (
                  <div className="mt-1 text-xs text-gray-500">
                    {healthData.video_codec ? `Codec: ${healthData.video_codec}` : ''}
                  </div>
                )}
              </div>

              {/* Last Seen */}
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-sm font-medium">Last Active</p>
                </div>
                <p className="text-lg font-semibold text-gray-600">
                  {healthData?.last_seen_time ? formatTimeSince(healthData.last_seen_time) : 'N/A'}
                </p>
                {healthData?.last_seen_time && (
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(healthData.last_seen_time).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Audio Bitrate */}
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="h-4 w-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 3v18M8 8v8M16 8v8M4 10v4M20 10v4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p className="text-sm font-medium">Audio Bitrate</p>
                </div>
                <p className="text-lg font-semibold text-gray-600">
                  {healthData?.audio_bitrate ? `${healthData.audio_bitrate} kbps` : 'N/A'}
                </p>
              </div>

              {/* Viewer Count (if available) */}
              <div className="p-3 border rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="h-4 w-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 5.5C7 5.5 2.73 8.61 1 13c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <p className="text-sm font-medium">Viewers</p>
                </div>
                <p className="text-lg font-semibold text-gray-600">
                  {healthData?.viewer_count !== undefined ? healthData.viewer_count : 'N/A'}
                </p>
                <div className="mt-1 text-xs text-gray-500">
                  {healthData?.viewer_count === undefined ? 'Viewer count not available' : ''}
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-4 flex justify-between items-center">
              <span>Auto-refreshes every 30 seconds</span>
              <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default HealthStatsPanel
