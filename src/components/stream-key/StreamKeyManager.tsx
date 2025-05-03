'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import StreamKeyReveal from './StreamKeyReveal'
import StreamKeyAdminOverride from './StreamKeyAdminOverride'
import ResetStreamKeyButton from '@/components/buttons/ResetStreamKeyButton'

export const StreamKeyManager: React.FC = () => {
  const { document } = useDocumentInfo()

  // If there's no Mux live stream, don't show the panel
  if (!document?.muxLiveStreamId) {
    return null
  }

  // Don't show stream key management for disabled or completed streams
  const isStreamActive = !['disabled', 'completed'].includes(document?.muxStatus)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Stream Key Management</CardTitle>
        <CardDescription>Securely manage your Mux stream key</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isStreamActive ? (
          <>
            <StreamKeyReveal />

            <Separator className="my-4" />

            <div>
              <ResetStreamKeyButton />
              <div className="mt-2 text-xs text-gray-500">
                Resets your stream key via Mux API. You'll need to update your streaming software.
              </div>
            </div>

            <Separator className="my-4" />

            <StreamKeyAdminOverride />
          </>
        ) : (
          <div className="text-sm text-gray-500">
            Stream key management is only available for active streams.
            {document?.muxStatus === 'disabled' && ' Enable the stream to manage keys.'}
            {document?.muxStatus === 'completed' && ' Completed streams cannot be reused.'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StreamKeyManager
