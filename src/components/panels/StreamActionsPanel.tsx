'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DisableStreamButton from '@/components/buttons/DisableStreamButton'
import EnableStreamButton from '@/components/buttons/EnableStreamButton'
import DeleteStreamButton from '@/components/buttons/DeleteStreamButton'
import EndStreamButton from '@/components/buttons/EndStreamButton'
import GoLiveButton from '@/components/buttons/GoLiveButton'

export const StreamActionsPanel: React.FC = () => {
  const { document } = useDocumentInfo()

  // If there's no Mux live stream, don't show the panel
  if (!document?.muxLiveStreamId) {
    return null
  }

  // Determine the status badge color
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'gray'

    switch (status) {
      case 'active':
        return 'green'
      case 'idle':
        return 'blue'
      case 'disabled':
        return 'amber'
      default:
        return 'gray'
    }
  }

  const statusColor = getStatusColor(document?.muxStatus)

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Stream Actions</CardTitle>
          <Badge
            className={`bg-${statusColor}-500 hover:bg-${statusColor}-600 transition-colors duration-300`}
          >
            {document?.muxStatus || 'Unknown'}
          </Badge>
        </div>
        <CardDescription>Manage your Mux live stream</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {['idle', 'disconnected'].includes(document?.muxStatus) && <GoLiveButton />}
          {['active', 'disconnected'].includes(document?.muxStatus) && <EndStreamButton />}
          {document?.muxStatus === 'disabled' ? <EnableStreamButton /> : <DisableStreamButton />}
          <DeleteStreamButton />
        </div>
        {document?.endedAt && (
          <div className="mt-4 text-sm text-gray-500">
            <span className="font-medium">Ended at:</span>{' '}
            {new Date(document.endedAt).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StreamActionsPanel
