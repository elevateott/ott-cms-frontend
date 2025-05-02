'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Play } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'

const logger = clientLogger.createContextLogger('GoLiveButton')

export const GoLiveButton: React.FC = () => {
  const { id, document, refresh } = useDocumentInfo()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Only show for idle or disconnected streams
  if (!document || !['idle', 'disconnected'].includes(document.muxStatus)) {
    return null
  }

  const handleGoLive = async () => {
    try {
      setLoading(true)

      // Call the API to start the stream
      const response = await fetch(`/api/live-events/${id}/go-live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to start stream')
      }

      // Show success message
      toast({
        title: 'Stream started',
        description: 'Your live stream is now active',
        variant: 'success',
      })

      // Refresh the document to show updated status
      refresh()
    } catch (error) {
      logger.error('Error starting stream:', error)

      // Show error message
      toast({
        title: 'Failed to start stream',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleGoLive} disabled={loading} className="bg-green-600 hover:bg-green-700">
      <Play className="h-4 w-4 mr-2" />
      {loading ? 'Starting...' : 'Go Live'}
    </Button>
  )
}

export default GoLiveButton
