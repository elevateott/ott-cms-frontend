'use client'

import React, { useEffect, useState } from 'react'
import { clientLogger } from '@/utils/clientLogger'
import { formatDuration } from '@/utilities/formatDuration'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

const logger = clientLogger.createContextLogger('SimulatedLivePlayer')

interface SimulatedLivePlayerProps {
  startTime: string
  playbackUrl: string
  title?: string
  thumbnailUrl?: string
}

export const SimulatedLivePlayer: React.FC<SimulatedLivePlayerProps> = ({
  startTime,
  playbackUrl,
  title,
  thumbnailUrl,
}) => {
  const [isLive, setIsLive] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Calculate if the stream is live based on the start time
  useEffect(() => {
    try {
      const calculateTimeLeft = () => {
        const now = Date.now()
        const start = new Date(startTime).getTime()
        const diff = start - now

        // If the start time is in the past, the stream is live
        if (diff <= 0) {
          setIsLive(true)
          setTimeLeft(0)
        } else {
          setIsLive(false)
          setTimeLeft(Math.floor(diff / 1000)) // Convert to seconds
        }
      }

      // Calculate immediately
      calculateTimeLeft()

      // Update every second
      const interval = setInterval(calculateTimeLeft, 1000)

      // Clean up interval on unmount
      return () => clearInterval(interval)
    } catch (err) {
      logger.error('Error calculating time left:', err)
      setError('Error calculating stream start time')
      return () => {}
    }
  }, [startTime])

  // Listen for simulated live events
  useEventBusOn(
    EVENTS.SIMULATED_LIVE_STARTED,
    (data) => {
      if (data.playbackUrl === playbackUrl) {
        setIsLive(true)
      }
    },
    [playbackUrl]
  )

  // Format the countdown display
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return 'Starting now...'

    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    )
  }

  if (timeLeft === null) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 flex items-center justify-center h-64">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!isLive) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {thumbnailUrl && (
          <div className="relative">
            <img
              src={thumbnailUrl}
              alt={title || 'Upcoming stream'}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white">
              <h3 className="text-xl font-bold mb-2">{title || 'Upcoming Stream'}</h3>
              <div className="text-2xl font-mono bg-black bg-opacity-75 px-4 py-2 rounded-lg">
                {formatCountdown(timeLeft)}
              </div>
              <p className="mt-4 text-sm">
                Scheduled to start on {new Date(startTime).toLocaleString()}
              </p>
            </div>
          </div>
        )}
        {!thumbnailUrl && (
          <div className="h-64 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold mb-2">{title || 'Upcoming Stream'}</h3>
            <div className="text-2xl font-mono bg-gray-800 text-white px-4 py-2 rounded-lg">
              {formatCountdown(timeLeft)}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Scheduled to start on {new Date(startTime).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="aspect-video bg-black">
        <video
          src={playbackUrl}
          controls
          autoPlay
          playsInline
          className="w-full h-full"
          poster={thumbnailUrl}
        />
      </div>
      {title && (
        <div className="p-3 bg-gray-100 border-t border-gray-200">
          <h3 className="font-medium">{title}</h3>
          <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            LIVE
          </div>
        </div>
      )}
    </div>
  )
}

export default SimulatedLivePlayer
