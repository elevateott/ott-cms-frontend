'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Download } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'

const logger = clientLogger.createContextLogger('DownloadOBSConfigButton')

export const DownloadOBSConfigButton: React.FC = () => {
  const { document } = useDocumentInfo()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<'json' | 'txt'>('json')

  // Only show for Mux streams that are not using external HLS
  if (!document?.muxStreamKey || document?.useExternalHlsUrl) {
    return null
  }

  const generateJsonConfig = () => {
    const config = {
      obs_stream_settings: {
        service: 'Custom',
        server: 'rtmp://global-live.mux.com:5222/app',
        stream_key: document.muxStreamKey,
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
          title: document.title || 'Live Stream',
          description: document.description || '',
          start_time: document.scheduledStartTime
            ? new Date(document.scheduledStartTime).toISOString()
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
    return `OBS STREAM SETUP FOR: ${document.title || 'Live Stream'}
${document.description ? `Description: ${document.description}\n` : ''}
${document.scheduledStartTime ? `Scheduled Start: ${new Date(document.scheduledStartTime).toLocaleString()}\n` : ''}
=======================================================

STREAM CONNECTION DETAILS:
--------------------------
Service: Custom
RTMP Server URL: rtmp://global-live.mux.com:5222/app
Stream Key: ${document.muxStreamKey}

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
5. Enter your Stream Key: ${document.muxStreamKey}
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
      logger.info('Downloading OBS config file', { format })

      // Generate content based on selected format
      const content = format === 'json' ? generateJsonConfig() : generateTxtConfig()
      const mimeType = format === 'json' ? 'application/json' : 'text/plain'
      const extension = format === 'json' ? 'json' : 'txt'

      // Create and download the file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${document.title || 'stream'}-obs-config.${extension}`
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

      // Close the dialog
      setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mb-4">
          <Download className="mr-2 h-4 w-4" />
          Download OBS Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download OBS Configuration</DialogTitle>
          <DialogDescription>
            Download a configuration file for OBS Studio with your stream settings pre-configured.
          </DialogDescription>
        </DialogHeader>

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
                <p className="text-sm text-gray-500">
                  JSON format contains structured data that can be used as a reference for your OBS
                  settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="txt">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-500">
                  Text format provides easy-to-read instructions and settings that can be manually
                  entered into OBS.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download {format.toUpperCase()} File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DownloadOBSConfigButton
