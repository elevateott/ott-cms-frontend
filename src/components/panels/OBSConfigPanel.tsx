'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clientLogger } from '@/utils/clientLogger'
import DownloadOBSConfigButton from '@/components/buttons/DownloadOBSConfigButton'

const logger = clientLogger.createContextLogger('OBSConfigPanel')

export const OBSConfigPanel: React.FC = () => {
  const { document } = useDocumentInfo()

  // Only show for Mux streams that are not using external HLS
  if (!document?.muxStreamKey || document?.useExternalHlsUrl) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>OBS Studio Configuration</CardTitle>
        <CardDescription>Download a pre-configured settings file for OBS Studio</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm">
            Download a configuration file that contains your stream settings for easy setup in OBS
            Studio. This file includes your RTMP URL, stream key, and recommended encoding settings
            optimized for Mux.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Quick Setup Instructions</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Download the configuration file</li>
                <li>Open OBS Studio</li>
                <li>Go to Settings &gt; Stream</li>
                <li>Set Service to "Custom"</li>
                <li>Enter the RTMP URL and Stream Key from the file</li>
                <li>Configure your output settings as recommended</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">Recommended Settings</h4>
              <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                <li>Resolution: 1920x1080 (1080p)</li>
                <li>Bitrate: 4500 Kbps</li>
                <li>Encoder: x264</li>
                <li>Preset: veryfast</li>
                <li>Keyframe Interval: 2 seconds</li>
                <li>Audio: 160 Kbps, 48 kHz</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-amber-800 mb-2">Available Formats</h4>
            <p className="text-sm text-amber-700">
              <strong>JSON Format:</strong> Contains structured data that can be used as a reference
              for your OBS settings.
            </p>
            <p className="text-sm text-amber-700 mt-1">
              <strong>TXT Format:</strong> Provides easy-to-read instructions and settings that can
              be manually entered into OBS.
            </p>
          </div>

          <DownloadOBSConfigButton />

          <p className="text-xs text-gray-500 mt-2">
            Note: This configuration file is for reference only. OBS Studio does not have a direct
            import feature for stream settings. You will need to manually enter these settings in
            OBS.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default OBSConfigPanel
