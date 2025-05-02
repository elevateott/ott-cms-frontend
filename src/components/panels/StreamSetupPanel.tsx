'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

const logger = clientLogger.createContextLogger('StreamSetupPanel')

export const StreamSetupPanel: React.FC = () => {
  const { document } = useDocumentInfo()
  const { toast } = useToast()
  
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState<Record<string, boolean>>({
    rtmp: false,
    streamKey: false,
    srt: false,
  })
  const [activeTab, setActiveTab] = useState('obs')

  // Extract data from document
  const streamKey = document?.muxStreamKey
  const useExternalHlsUrl = document?.useExternalHlsUrl
  const muxStatus = document?.muxStatus

  // If there's no Mux live stream or using external HLS, don't show the panel
  if (!streamKey || useExternalHlsUrl) {
    return null
  }

  // Constants
  const rtmpUrl = 'rtmp://global-live.mux.com:5222/app'
  const srtUrl = `srt://global-live.mux.com:5222?streamid=${streamKey}`

  // Handle copy to clipboard
  const handleCopy = async (value: string, type: 'rtmp' | 'streamKey' | 'srt') => {
    try {
      await navigator.clipboard.writeText(value)
      
      // Update copied state
      setCopied((prev) => ({
        ...prev,
        [type]: true,
      }))
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied((prev) => ({
          ...prev,
          [type]: false,
        }))
      }, 2000)
      
      // Show toast
      toast({
        title: 'Copied to clipboard',
        description: 'The value has been copied to your clipboard.',
        duration: 2000,
      })
      
      logger.info(`Copied ${type} to clipboard`)
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

  // Handle OBS config download
  const handleDownloadOBSConfig = () => {
    try {
      // Create OBS config object
      const obsConfig = {
        settings: {
          stream: {
            server: rtmpUrl,
            key: streamKey,
            service: "Custom",
            type: "rtmp_custom",
          },
          output: {
            mode: "advanced",
            advanced: {
              bitrate: 4500, // video bitrate kbps
              encoder: "x264", // or 'obs_qsv11', 'nvenc', etc depending on hardware
              keyint_sec: 2, // keyframe interval
              preset: "veryfast", // encoder preset
              profile: "high",
              rate_control: "CBR", // constant bitrate
            },
            audio_bitrate: 160, // audio bitrate kbps
          },
          video: {
            base_resolution: "1920x1080",
            output_resolution: "1280x720",
            downscale_filter: "lanczos",
            fps_num: 30,
            fps_den: 1,
          },
          audio: {
            sample_rate: 48000,
            channels: 2, // stereo
          },
        },
      }

      // Create and download the file
      const blob = new Blob([JSON.stringify(obsConfig, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'obs-stream-settings.json'
      link.click()
      URL.revokeObjectURL(url)

      // Show toast
      toast({
        title: 'OBS Config Downloaded',
        description: 'Import this file in OBS to configure your stream settings.',
        duration: 3000,
      })

      logger.info('Downloaded OBS config file')
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Stream Setup</CardTitle>
        <CardDescription>
          Configure your streaming software to broadcast to this live event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stream Connection Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Connection Details</h3>
          
          {/* RTMP URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">RTMP Server URL</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                {rtmpUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(rtmpUrl, 'rtmp')}
                title="Copy RTMP URL"
              >
                {copied.rtmp ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Stream Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">Stream Key</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                {revealed ? streamKey : '••••••••••••••••••••••••••••••••'}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRevealed(!revealed)}
                title={revealed ? "Hide Stream Key" : "Reveal Stream Key"}
              >
                {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {revealed && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(streamKey, 'streamKey')}
                  title="Copy Stream Key"
                >
                  {copied.streamKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </div>
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                <strong>Warning:</strong> Never share your stream key. Anyone with this key can broadcast to your channel.
              </AlertDescription>
            </Alert>
          </div>
          
          {/* SRT URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">SRT URL</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                {srtUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(srtUrl, 'srt')}
                title="Copy SRT URL"
              >
                {copied.srt ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Setup Instructions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Setup Instructions</h3>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="obs">OBS Studio</TabsTrigger>
              <TabsTrigger value="streamlabs">Streamlabs</TabsTrigger>
              <TabsTrigger value="restream">Restream</TabsTrigger>
            </TabsList>
            
            {/* OBS Studio Instructions */}
            <TabsContent value="obs" className="space-y-4 mt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open OBS Studio</li>
                <li>Go to <strong>Settings</strong> &gt; <strong>Stream</strong></li>
                <li>Set <strong>Service</strong> to <strong>Custom...</strong></li>
                <li>Enter <strong>Server</strong>: {rtmpUrl}</li>
                <li>Enter <strong>Stream Key</strong>: [your stream key]</li>
                <li>Click <strong>Apply</strong> then <strong>OK</strong></li>
                <li>Click <strong>Start Streaming</strong> when ready to broadcast</li>
              </ol>
              
              <div className="mt-4">
                <Button onClick={handleDownloadOBSConfig} className="w-full">
                  Download OBS Config (.json)
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Download a pre-configured settings file for OBS. Import this file in OBS via <strong>File</strong> &gt; <strong>Settings</strong> &gt; <strong>Import</strong>.
                </p>
              </div>
            </TabsContent>
            
            {/* Streamlabs Instructions */}
            <TabsContent value="streamlabs" className="space-y-4 mt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open Streamlabs Desktop</li>
                <li>Go to <strong>Settings</strong> &gt; <strong>Stream</strong></li>
                <li>Set <strong>Stream Type</strong> to <strong>Custom Streaming Server</strong></li>
                <li>Enter <strong>URL</strong>: {rtmpUrl}</li>
                <li>Enter <strong>Stream Key</strong>: [your stream key]</li>
                <li>Click <strong>Done</strong></li>
                <li>Click <strong>Go Live</strong> when ready to broadcast</li>
              </ol>
            </TabsContent>
            
            {/* Restream Instructions */}
            <TabsContent value="restream" className="space-y-4 mt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Log in to your Restream account</li>
                <li>Go to <strong>Stream</strong> &gt; <strong>Add Destination</strong> &gt; <strong>Custom RTMP</strong></li>
                <li>Enter a name for your stream (e.g., "Mux Live")</li>
                <li>Enter <strong>RTMP URL</strong>: {rtmpUrl}</li>
                <li>Enter <strong>Stream Key</strong>: [your stream key]</li>
                <li>Click <strong>Add Channel</strong></li>
                <li>Start streaming from your broadcasting software to Restream</li>
              </ol>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

export default StreamSetupPanel
