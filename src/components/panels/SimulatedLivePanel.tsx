'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Clipboard, Calendar, Play } from 'lucide-react'
import { formatDate } from '@/utilities/formatDate'
import { clientLogger } from '@/utils/clientLogger'

const logger = clientLogger.createContextLogger('SimulatedLivePanel')

export const SimulatedLivePanel: React.FC = () => {
  const { document } = useDocumentInfo()
  const { toast } = useToast()
  const [isLive, setIsLive] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // Only show for simulated live events
  if (!document?.isSimulatedLive || !document?.simulatedLivePlaybackId) {
    return null
  }

  const playbackUrl = `https://stream.mux.com/${document.simulatedLivePlaybackId}.m3u8`
  const startTime = document.simulatedLiveStartTime

  // Calculate if the stream is live and time left
  useEffect(() => {
    if (!startTime) return

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
  }, [startTime])

  // Format the countdown display
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return 'Live now'

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

  // Copy playback URL to clipboard
  const copyPlaybackUrl = () => {
    navigator.clipboard.writeText(playbackUrl)
      .then(() => {
        setCopySuccess(true)
        toast({
          title: 'Copied!',
          description: 'Playback URL copied to clipboard',
          duration: 3000,
        })
        setTimeout(() => setCopySuccess(false), 2000)
      })
      .catch(err => {
        logger.error('Failed to copy playback URL:', err)
        toast({
          title: 'Failed to copy',
          description: 'Could not copy to clipboard',
          variant: 'destructive',
          duration: 3000,
        })
      })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Simulated Live Stream</CardTitle>
          <Badge
            className={`${isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} transition-colors duration-300`}
          >
            {isLive ? 'LIVE NOW' : 'SCHEDULED'}
          </Badge>
        </div>
        <CardDescription>
          Pre-recorded video streaming as if live
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Start Time:</span>
            </div>
            <span className="font-medium">
              {formatDate(startTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Status:</span>
            </div>
            <span className="font-medium">
              {timeLeft !== null ? formatCountdown(timeLeft) : 'Loading...'}
            </span>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700">Playback URL:</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyPlaybackUrl}
                className={copySuccess ? 'bg-green-50 text-green-700 border-green-200' : ''}
              >
                <Clipboard className="h-4 w-4 mr-1" />
                {copySuccess ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all">
              {playbackUrl}
            </div>
          </div>
          
          {document.simulatedLiveAssetId && (
            <div className="pt-2">
              <span className="text-sm text-gray-700">Source Recording:</span>
              <div className="mt-1">
                <a 
                  href={`/admin/collections/recordings/${document.simulatedLiveAssetId}`}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Source Recording
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SimulatedLivePanel
