'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, AlertTriangle } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { useToast } from '@/hooks/use-toast'

const logger = clientLogger.createContextLogger('ExternalHlsPreviewPlayer')

export const ExternalHlsPreviewPlayer: React.FC = () => {
  const { document } = useDocumentInfo()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [streamStatus, setStreamStatus] = useState<'live' | 'offline' | 'loading'>('loading')
  const [playerKey, setPlayerKey] = useState(0)
  const [lastStatusChange, setLastStatusChange] = useState<Date | null>(null)
  
  const useExternalHls = document?.useExternalHlsUrl
  const externalHlsUrl = document?.externalHlsUrl
  
  // Validate the URL
  const isValidUrl = externalHlsUrl && /^https?:\/\/.*\.m3u8$/i.test(externalHlsUrl)
  
  // Handle player events
  useEffect(() => {
    const video = videoRef.current
    if (!video || !isValidUrl) return
    
    const handlePlaying = () => {
      if (streamStatus !== 'live') {
        setStreamStatus('live')
        setLastStatusChange(new Date())
        
        // Show toast when stream becomes live
        if (streamStatus === 'offline') {
          toast({
            title: 'Stream is Live',
            description: 'The external stream is now playing',
            duration: 3000,
          })
        }
        
        logger.info('External stream is playing')
      }
    }
    
    const handleError = (e: ErrorEvent) => {
      if (streamStatus !== 'offline') {
        setStreamStatus('offline')
        setLastStatusChange(new Date())
        
        // Show toast when stream goes offline
        if (streamStatus === 'live') {
          toast({
            title: 'Stream Offline',
            description: 'The external stream is currently unavailable',
            variant: 'destructive',
            duration: 3000,
          })
        }
        
        logger.error('External stream error:', e)
        
        // Auto-retry after 10 seconds
        setTimeout(() => {
          setPlayerKey((prev) => prev + 1)
          setStreamStatus('loading')
        }, 10000)
      }
    }
    
    const handleStalled = () => {
      logger.warn('External stream stalled')
    }
    
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('error', handleError as EventListener)
    video.addEventListener('stalled', handleStalled)
    
    return () => {
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('error', handleError as EventListener)
      video.removeEventListener('stalled', handleStalled)
    }
  }, [videoRef.current, streamStatus, isValidUrl, toast])
  
  // Auto-refresh player every 5 minutes
  useEffect(() => {
    if (!isValidUrl) return
    
    const interval = setInterval(() => {
      setPlayerKey((prev) => prev + 1)
      logger.info('Auto-refreshing external stream player')
    }, 5 * 60 * 1000) // Every 5 minutes
    
    return () => clearInterval(interval)
  }, [isValidUrl])
  
  // Don't render anything if external HLS is not enabled
  if (!useExternalHls) {
    return null
  }
  
  // Show error if URL is invalid
  if (!isValidUrl) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>External Stream Preview</CardTitle>
          <CardDescription>
            Preview your external HLS stream
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Invalid External HLS URL. The URL must start with http:// or https:// and end with .m3u8
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>External Stream Preview</CardTitle>
          <Badge
            variant={streamStatus === 'live' ? 'default' : streamStatus === 'loading' ? 'outline' : 'destructive'}
          >
            {streamStatus === 'live' ? 'LIVE' : streamStatus === 'loading' ? 'LOADING' : 'OFFLINE'}
          </Badge>
        </div>
        <CardDescription>
          Preview your external HLS stream
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="aspect-video bg-gray-100 rounded overflow-hidden">
          <video
            key={playerKey}
            ref={videoRef}
            controls
            autoPlay
            className="w-full h-full"
            src={externalHlsUrl}
            onLoadStart={() => setStreamStatus('loading')}
          />
        </div>
        
        {streamStatus === 'offline' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Stream is currently offline or unavailable. Auto-retrying every 10 seconds.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Play className="h-4 w-4" />
          <span>Player refreshes automatically every 5 minutes.</span>
        </div>
        
        {lastStatusChange && (
          <div className="text-xs text-gray-500">
            Last status change: {lastStatusChange.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ExternalHlsPreviewPlayer
