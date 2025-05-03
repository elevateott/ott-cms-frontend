'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, Play, Clock } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const logger = clientLogger.createContextLogger('PlaybackURLPanel')

export const PlaybackURLPanel: React.FC = () => {
  const { document } = useDocumentInfo()
  const { toast } = useToast()

  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isGeneratingSignedUrl, setIsGeneratingSignedUrl] = useState(false)
  const [ttl, setTtl] = useState<number>(60) // Default 60 seconds
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [playerKey, setPlayerKey] = useState(0)

  // Extract playback information from the document
  const playbackIds = document?.muxPlaybackIds || []
  const playbackPolicy = document?.playbackPolicy || 'public'
  const muxStatus = document?.muxStatus
  const useExternalHlsUrl = document?.useExternalHlsUrl
  const externalHlsUrl = document?.externalHlsUrl

  // Format the playback URL
  const getPlaybackUrl = (playbackId: string) => {
    return `https://stream.mux.com/${playbackId}.m3u8`
  }

  // Get the appropriate playback URL based on source type
  const getAppropriatePlaybackUrl = () => {
    if (useExternalHlsUrl && externalHlsUrl) {
      return externalHlsUrl
    }

    if (playbackIds.length > 0) {
      return getPlaybackUrl(playbackIds[0]?.playbackId)
    }

    return null
  }

  // Handle copy to clipboard
  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)

      // Set copied state for this specific button
      setCopied({ ...copied, [key]: true })

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied({ ...copied, [key]: false })
      }, 2000)

      toast({
        title: 'Copied',
        description: 'URL copied to clipboard',
        duration: 2000,
      })

      logger.info('Playback URL copied to clipboard')
    } catch (error) {
      logger.error('Error copying URL to clipboard:', error)

      toast({
        title: 'Error',
        description: 'Failed to copy URL to clipboard',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  // Generate a signed URL
  const generateSignedUrl = async () => {
    if (!playbackIds.length) return

    try {
      setIsGeneratingSignedUrl(true)

      const playbackId = playbackIds[0]?.playbackId
      if (!playbackId) {
        throw new Error('No playback ID available')
      }

      const response = await fetch(
        `/api/admin/live-events/${document.id}/signed-playback?ttl=${ttl}`,
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate signed URL')
      }

      const data = await response.json()
      setSignedUrl(data.signedUrl)

      toast({
        title: 'Success',
        description: 'Signed URL generated successfully',
        duration: 3000,
      })

      logger.info('Generated signed playback URL')
    } catch (error) {
      logger.error('Error generating signed URL:', error)

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate signed URL',
        variant: 'destructive',
        duration: 3000,
      })
    } finally {
      setIsGeneratingSignedUrl(false)
    }
  }

  // Auto-refresh player every 5 minutes for live streams
  React.useEffect(() => {
    if (playbackPolicy !== 'public' || !['active', 'idle'].includes(muxStatus)) return

    const interval = setInterval(
      () => {
        setPlayerKey((k) => k + 1)
      },
      5 * 60 * 1000,
    ) // Every 5 minutes

    return () => clearInterval(interval)
  }, [playbackPolicy, muxStatus])

  // If there are no playback URLs available, show a message
  if (!playbackIds.length && !externalHlsUrl) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Playback URLs</CardTitle>
          <CardDescription>No playback URLs available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {useExternalHlsUrl
                ? 'Please enter a valid external HLS URL to enable playback.'
                : 'Playback URLs will be available once the live stream is created.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Playback URLs</CardTitle>
        <CardDescription>
          Use these URLs to embed your live stream in websites, apps, or OTT platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* HLS Playback URL */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium">HLS Playback URL</div>
            {!useExternalHlsUrl && (
              <div className="text-sm text-gray-500">
                Policy: <span className="font-medium">{playbackPolicy.toUpperCase()}</span>
              </div>
            )}
            {useExternalHlsUrl && (
              <div className="text-sm text-gray-500">
                Source: <span className="font-medium">EXTERNAL</span>
              </div>
            )}
          </div>

          {/* External HLS URL */}
          {useExternalHlsUrl && externalHlsUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 w-full overflow-x-auto">
                  {externalHlsUrl}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(externalHlsUrl, 'external')}
                  className="flex items-center gap-1 whitespace-nowrap"
                >
                  {copied['external'] ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copied['external'] ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              <div className="text-sm text-gray-500">
                Use this URL in your web, mobile, Roku, Fire TV, or other players that support HLS.
              </div>
            </div>
          )}

          {/* Mux Playback IDs */}
          {!useExternalHlsUrl &&
            playbackIds.map((playbackId, index) => {
              const url = getPlaybackUrl(playbackId.playbackId)
              const copyKey = `base-${index}`

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 w-full overflow-x-auto">
                      {url}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(url, copyKey)}
                      className="flex items-center gap-1 whitespace-nowrap"
                    >
                      {copied[copyKey] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>{copied[copyKey] ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>

                  <div className="text-sm text-gray-500">
                    Use this URL in your web, mobile, Roku, Fire TV, or other players that support
                    HLS.
                  </div>
                </div>
              )
            })}

          {/* Signed URL Generator (for signed playback policy) */}
          {!useExternalHlsUrl && playbackPolicy === 'signed' && (
            <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="font-medium">Generate Signed URL</div>

                <Alert variant="warning">
                  <AlertDescription className="text-sm">
                    This stream requires a signed token for playback. Generate a temporary signed
                    URL below.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Token TTL:</span>
                  </div>
                  <Select
                    value={ttl.toString()}
                    onValueChange={(value) => setTtl(parseInt(value, 10))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select TTL" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="900">15 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={generateSignedUrl}
                    disabled={isGeneratingSignedUrl}
                    className="ml-2"
                  >
                    {isGeneratingSignedUrl ? 'Generating...' : 'Generate Signed URL'}
                  </Button>
                </div>

                {signedUrl && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 w-full overflow-x-auto">
                        {signedUrl}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(signedUrl, 'signed')}
                        className="flex items-center gap-1 whitespace-nowrap"
                      >
                        {copied['signed'] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span>{copied['signed'] ? 'Copied' : 'Copy'}</span>
                      </Button>
                    </div>

                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        This URL will expire in{' '}
                        {ttl === 60
                          ? '1 minute'
                          : ttl === 300
                            ? '5 minutes'
                            : ttl === 900
                              ? '15 minutes'
                              : '1 hour'}
                        .
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Player (for public Mux streams) */}
          {!useExternalHlsUrl &&
            playbackPolicy === 'public' &&
            ['active', 'idle'].includes(muxStatus) && (
              <div className="mt-6 space-y-2 pt-4 border-t border-gray-200">
                <div className="font-medium flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span>Preview Player</span>
                </div>

                <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                  <video
                    key={playerKey}
                    controls
                    className="w-full h-full"
                    src={getPlaybackUrl(playbackIds[0]?.playbackId)}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  Player refreshes automatically every 5 minutes while the stream is active.
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PlaybackURLPanel
