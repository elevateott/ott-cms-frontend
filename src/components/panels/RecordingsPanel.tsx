'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Check, ExternalLink, Download, Play, Clock } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { formatDuration } from '@/utils/dateTime'
import { formatDistanceToNow } from 'date-fns'

const logger = clientLogger.createContextLogger('RecordingsPanel')

type Recording = {
  id: string
  title: string
  description?: string
  playbackUrl?: string
  thumbnailUrl?: string
  duration?: number
  muxAssetId?: string
  muxPlaybackId?: string
  playbackPolicy?: 'public' | 'signed'
  price?: number
  downloadUrl?: string
  createdAt: string
}

export const RecordingsPanel: React.FC = () => {
  const { document, id } = useDocumentInfo()
  const { toast } = useToast()
  
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState<Record<string, boolean>>({})

  // Extract data from document
  const isRecordingEnabled = document?.isRecordingEnabled
  const recordingAssetId = document?.recordingAssetId
  const muxStatus = document?.muxStatus
  const useExternalHlsUrl = document?.useExternalHlsUrl
  
  // Fetch recordings for this live event
  useEffect(() => {
    const fetchRecordings = async () => {
      if (!id) return
      
      try {
        setIsLoading(true)
        
        // Fetch recordings from the API
        const response = await fetch(`/api/recordings?liveEvent=${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch recordings')
        }
        
        const data = await response.json()
        setRecordings(data.docs || [])
      } catch (error) {
        logger.error('Failed to fetch recordings', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch recordings',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRecordings()
  }, [id, toast])

  // Handle copy to clipboard
  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value)
      
      // Update copied state
      setCopied((prev) => ({
        ...prev,
        [key]: true,
      }))
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied((prev) => ({
          ...prev,
          [key]: false,
        }))
      }, 2000)
      
      // Show toast
      toast({
        title: 'Copied to clipboard',
        description: 'The value has been copied to your clipboard.',
        duration: 2000,
      })
      
      logger.info(`Copied ${key} to clipboard`)
    } catch (error) {
      logger.error('Failed to copy to clipboard', error)
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard. Please try again.',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  // Generate signed URL for playback
  const generateSignedUrl = async (recordingId: string, playbackId: string) => {
    try {
      const response = await fetch(`/api/admin/recordings/${recordingId}/signed-playback?ttl=3600`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate signed URL')
      }
      
      const data = await response.json()
      
      // Copy the signed URL to clipboard
      await handleCopy(data.signedUrl, `signed-${recordingId}`)
      
      logger.info('Generated and copied signed playback URL')
    } catch (error) {
      logger.error('Error generating signed URL:', error)
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate signed URL',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  // If external HLS URL is used, don't show the panel
  if (useExternalHlsUrl) {
    return null
  }

  // If recording is not enabled, show a message
  if (!isRecordingEnabled) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recordings</CardTitle>
          <CardDescription>
            Recording is not enabled for this live event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Enable recording in the live event settings to automatically create recordings when the stream ends.
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
          <CardTitle>Recordings</CardTitle>
          <Badge variant={isRecordingEnabled ? 'default' : 'outline'}>
            {isRecordingEnabled ? 'Recording Enabled' : 'Recording Disabled'}
          </Badge>
        </div>
        <CardDescription>
          Manage recordings of this live event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin mr-2">
              <Clock className="h-5 w-5" />
            </div>
            <span>Loading recordings...</span>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-md">
            {muxStatus === 'completed' && recordingAssetId ? (
              <div className="space-y-2">
                <p className="text-gray-500">Processing recording...</p>
                <p className="text-sm text-gray-400">
                  The recording is being processed. It will appear here when ready.
                </p>
              </div>
            ) : muxStatus === 'completed' ? (
              <p className="text-gray-500">No recordings available</p>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-500">No recordings yet</p>
                <p className="text-sm text-gray-400">
                  Recordings will be created automatically when the live stream ends.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <Card key={recording.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail */}
                  <div className="w-full md:w-1/3 h-48 md:h-auto relative bg-gray-100">
                    {recording.thumbnailUrl ? (
                      <img
                        src={recording.thumbnailUrl}
                        alt={recording.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400">No thumbnail</span>
                      </div>
                    )}
                    {recording.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(recording.duration)}
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{recording.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Created {formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {recording.playbackPolicy === 'signed' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => recording.muxPlaybackId && generateSignedUrl(recording.id, recording.muxPlaybackId)}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-4 w-4" />
                            <span>Signed URL</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => recording.playbackUrl && handleCopy(recording.playbackUrl, `url-${recording.id}`)}
                            className="flex items-center gap-1"
                          >
                            {copied[`url-${recording.id}`] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span>Copy URL</span>
                          </Button>
                        )}
                        
                        {recording.playbackUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(recording.playbackUrl, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <Play className="h-4 w-4" />
                            <span>Play</span>
                          </Button>
                        )}
                        
                        {recording.downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(recording.downloadUrl, '_blank')}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {recording.description && (
                      <p className="text-sm mt-2">{recording.description}</p>
                    )}
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {recording.muxAssetId ? 'Mux Recording' : 'External Recording'}
                      </Badge>
                      
                      <Badge variant={recording.playbackPolicy === 'public' ? 'secondary' : 'destructive'} className="text-xs">
                        {recording.playbackPolicy === 'public' ? 'Public' : 'Signed Playback'}
                      </Badge>
                      
                      {recording.price && recording.price > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ${(recording.price / 100).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-2 border-t border-gray-100">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-500"
                        onClick={() => window.open(`/admin/collections/recordings/${recording.id}`, '_blank')}
                      >
                        <span>Edit Recording</span>
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {muxStatus === 'active' && isRecordingEnabled && (
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Note:</strong> Recording is in progress. The recording will be available after the live stream ends.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default RecordingsPanel
