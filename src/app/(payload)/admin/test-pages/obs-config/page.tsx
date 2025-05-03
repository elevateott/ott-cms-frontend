'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const logger = clientLogger.createContextLogger('OBSConfigTestPage')

export default function OBSConfigTestPage() {
  const { toast } = useToast()
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [format, setFormat] = useState<'json' | 'txt'>('json')

  // Fetch live events
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/live-events?limit=100')
        const data = await response.json()
        setLiveEvents(data.docs || [])
      } catch (error) {
        logger.error('Failed to fetch live events', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveEvents()
  }, [])

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event)
  }

  const generateJsonConfig = () => {
    if (!selectedEvent?.muxStreamKey) return ''

    const config = {
      obs_stream_settings: {
        service: 'Custom',
        server: 'rtmp://global-live.mux.com:5222/app',
        stream_key: selectedEvent.muxStreamKey,
        output: {
          video: {
            bitrate: 4500,
            encoder: 'x264',
            preset: 'veryfast',
            keyframe_interval: 2,
            profile: 'high',
            tune: 'zerolatency',
            resolution: {
              width: 1920,
              height: 1080,
            },
            fps: 30,
          },
          audio: {
            bitrate: 160,
            channels: 2,
            sample_rate: 48000,
          },
        },
        event_info: {
          title: selectedEvent.title || 'Live Stream',
          description: selectedEvent.description || '',
          start_time: selectedEvent.scheduledStartTime
            ? new Date(selectedEvent.scheduledStartTime).toISOString()
            : null,
        },
      },
      instructions: {
        setup: [
          'Open OBS Studio',
          'Go to Settings > Stream',
          "Set Service to 'Custom'",
          'Enter the Server URL and Stream Key',
          'Go to Settings > Output',
          "Set Output Mode to 'Advanced'",
          'Set the Bitrate to 4500 Kbps',
          'Set Keyframe Interval to 2',
          "Set x264 CPU Preset to 'veryfast'",
          "Set Profile to 'high'",
          "Set Tune to 'zerolatency'",
        ],
        notes: [
          'These settings are optimized for Mux live streaming',
          'For best results, ensure your internet upload speed is at least 6 Mbps',
          'If you experience issues, try lowering the bitrate or resolution',
        ],
      },
    }
    return JSON.stringify(config, null, 2)
  }

  const generateTxtConfig = () => {
    if (!selectedEvent?.muxStreamKey) return ''

    return `OBS STREAM SETUP FOR: ${selectedEvent.title || 'Live Stream'}
${selectedEvent.description ? `Description: ${selectedEvent.description}\n` : ''}
${
  selectedEvent.scheduledStartTime
    ? `Scheduled Start: ${new Date(selectedEvent.scheduledStartTime).toLocaleString()}\n`
    : ''
}
=======================================================

STREAM CONNECTION DETAILS:
--------------------------
Service: Custom
RTMP Server URL: rtmp://global-live.mux.com:5222/app
Stream Key: ${selectedEvent.muxStreamKey}

RECOMMENDED VIDEO SETTINGS:
--------------------------
- Encoder: x264
- Rate Control: CBR
- Bitrate: 4500 Kbps
- Keyframe Interval: 2 seconds
- Preset: veryfast
- Profile: high
- Tune: zerolatency
- Resolution: 1920x1080
- Frame Rate: 30 FPS

RECOMMENDED AUDIO SETTINGS:
--------------------------
- Bitrate: 160 Kbps
- Channels: Stereo
- Sample Rate: 48 kHz

STEP-BY-STEP SETUP INSTRUCTIONS:
===============================
1. Open OBS Studio
2. Go to Settings > Stream
3. Set Service to "Custom"
4. Enter the Server URL: rtmp://global-live.mux.com:5222/app
5. Enter your Stream Key: ${selectedEvent.muxStreamKey}
6. Go to Settings > Output
7. Set Output Mode to "Advanced"
8. Under the Streaming tab:
   - Set Encoder to "x264"
   - Set Rate Control to "CBR"
   - Set Bitrate to "4500"
   - Set Keyframe Interval to "2"
   - Set CPU Usage Preset to "veryfast"
   - Set Profile to "high"
   - Set Tune to "zerolatency"
9. Go to Settings > Video
   - Set Base Resolution to "1920x1080"
   - Set Output Resolution to "1920x1080"
   - Set FPS to "30"
10. Go to Settings > Audio
    - Set Sample Rate to "48 kHz"
    - Set Channels to "Stereo"
11. Click "Apply" then "OK"
12. Click "Start Streaming" when ready to go live

TROUBLESHOOTING TIPS:
--------------------
- If you experience connection issues, try lowering your bitrate to 3000 Kbps
- For unstable internet connections, try reducing resolution to 1280x720
- Ensure your upload speed is at least 6 Mbps for 1080p streaming
- If you see "Disconnected" status, check your internet connection and try again
- For additional help, contact support

This configuration file was generated on ${new Date().toLocaleString()}`
  }

  const handleDownload = () => {
    try {
      if (!selectedEvent?.muxStreamKey) {
        toast({
          title: 'No stream key available',
          description: 'Please select a live event with a valid Mux stream key.',
          variant: 'destructive',
        })
        return
      }

      logger.info('Downloading OBS config file', { format, eventId: selectedEvent.id })

      // Generate content based on selected format
      const content = format === 'json' ? generateJsonConfig() : generateTxtConfig()
      const mimeType = format === 'json' ? 'application/json' : 'text/plain'
      const extension = format === 'json' ? 'json' : 'txt'

      // Create and download the file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedEvent.title || 'stream'}-obs-config.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show toast
      toast({
        title: 'OBS Config Downloaded',
        description: `Configuration file downloaded in ${format.toUpperCase()} format.`,
        duration: 3000,
      })
    } catch (error) {
      logger.error('Failed to download OBS config', error)
      toast({
        title: 'Download failed',
        description: 'Failed to download OBS config. Please try again.',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">OBS Config Generator Test Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Live Events</CardTitle>
              <CardDescription>Select a live event to generate OBS config</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : liveEvents.length === 0 ? (
                <p>No live events found</p>
              ) : (
                <div className="space-y-2">
                  {liveEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                        selectedEvent?.id === event.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectEvent(event)}
                    >
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {event.useExternalHlsUrl ? 'External HLS' : 'Mux Stream'}
                        </p>
                      </div>
                      {event.muxStatus && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            event.muxStatus === 'active'
                              ? 'bg-green-100 text-green-800'
                              : event.muxStatus === 'idle'
                              ? 'bg-blue-100 text-blue-800'
                              : event.muxStatus === 'disconnected'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {event.muxStatus}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>OBS Configuration Generator</CardTitle>
              <CardDescription>
                Generate a configuration file for OBS Studio with your stream settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedEvent ? (
                <p>Please select a live event from the list</p>
              ) : selectedEvent.useExternalHlsUrl ? (
                <p className="text-amber-600">
                  OBS configuration is only available for Mux streams, not external HLS URLs.
                </p>
              ) : !selectedEvent.muxStreamKey ? (
                <p className="text-amber-600">
                  This live event does not have a valid Mux stream key.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Stream Details</h3>
                    <p className="text-sm">
                      <strong>Title:</strong> {selectedEvent.title}
                    </p>
                    {selectedEvent.description && (
                      <p className="text-sm">
                        <strong>Description:</strong> {selectedEvent.description}
                      </p>
                    )}
                    <p className="text-sm">
                      <strong>Status:</strong> {selectedEvent.muxStatus || 'Unknown'}
                    </p>
                    {selectedEvent.scheduledStartTime && (
                      <p className="text-sm">
                        <strong>Scheduled Start:</strong>{' '}
                        {new Date(selectedEvent.scheduledStartTime).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <Tabs
                    defaultValue="json"
                    className="w-full"
                    onValueChange={(value) => setFormat(value as 'json' | 'txt')}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="json">JSON Format</TabsTrigger>
                      <TabsTrigger value="txt">TXT Format</TabsTrigger>
                    </TabsList>

                    <TabsContent value="json">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm text-gray-500 mb-4">
                            JSON format contains structured data that can be used as a reference for
                            your OBS settings.
                          </p>
                          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-60">
                            {generateJsonConfig()}
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="txt">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm text-gray-500 mb-4">
                            Text format provides easy-to-read instructions and settings that can be
                            manually entered into OBS.
                          </p>
                          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                            {generateTxtConfig()}
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>

                  <Button onClick={handleDownload} disabled={!selectedEvent?.muxStreamKey}>
                    <Download className="mr-2 h-4 w-4" />
                    Download {format.toUpperCase()} File
                  </Button>

                  <p className="text-xs text-gray-500">
                    Note: This configuration file is for reference only. OBS Studio does not have a
                    direct import feature for stream settings. You will need to manually enter these
                    settings in OBS.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
