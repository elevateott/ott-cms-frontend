'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Clock, WifiOff } from 'lucide-react'
import { useEventBus } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

/**
 * StreamStatusBanner
 * 
 * A component to display the live stream status as a banner in the admin UI
 * with auto-refresh functionality and real-time updates via the event bus.
 */
export const StreamStatusBanner: React.FC = () => {
  const { doc, id } = useDocumentInfo()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true)
  const eventBus = useEventBus()

  // Function to refresh the document
  const refreshDocument = async () => {
    try {
      const response = await fetch(`/api/live-events/${id}`)
      if (response.ok) {
        const updatedDoc = await response.json()
        // Update the document in the Payload admin UI
        // This is a bit of a hack, but it works for now
        Object.keys(updatedDoc).forEach(key => {
          if (doc && key in doc) {
            // @ts-ignore - we know the key exists
            doc[key] = updatedDoc[key]
          }
        })
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error refreshing document:', error)
    }
  }

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh || !id) return

    const interval = setInterval(() => {
      refreshDocument()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, id])

  // Listen for live stream events
  useEffect(() => {
    if (!id) return

    const handleStatusUpdate = (event: any) => {
      if (event.id === id) {
        refreshDocument()
      }
    }

    // Subscribe to all relevant events
    const subscriptions = [
      eventBus.on(EVENTS.LIVE_STREAM_ACTIVE, handleStatusUpdate),
      eventBus.on(EVENTS.LIVE_STREAM_IDLE, handleStatusUpdate),
      eventBus.on(EVENTS.LIVE_STREAM_DISCONNECTED, handleStatusUpdate),
      eventBus.on(EVENTS.LIVE_STREAM_STATUS_UPDATED, handleStatusUpdate),
    ]

    return () => {
      // Unsubscribe from all events
      subscriptions.forEach(unsubscribe => unsubscribe())
    }
  }, [id, eventBus])

  // If no document or no muxStatus, don't render anything
  if (!doc || !doc.muxStatus) return null

  // Skip rendering for external HLS streams
  if (doc.useExternalHlsUrl) return null

  const muxStatus = doc.muxStatus
  
  // Determine the alert variant and content based on the status
  let variant: 'default' | 'destructive' | 'success' | 'warning' = 'default'
  let icon = <Clock className="h-4 w-4" />
  let title = 'Stream Status'
  let description = 'Unknown stream status'

  switch (muxStatus) {
    case 'active':
      variant = 'success'
      icon = <CheckCircle2 className="h-4 w-4" />
      title = 'Stream is Live!'
      description = 'Your stream is currently active and broadcasting to viewers.'
      break
    case 'idle':
      variant = 'default'
      icon = <Clock className="h-4 w-4" />
      title = 'Stream is Idle'
      description = 'Your stream is ready but not currently broadcasting.'
      break
    case 'disconnected':
      variant = 'warning'
      icon = <WifiOff className="h-4 w-4" />
      title = 'Stream Disconnected'
      description = 'Your stream has disconnected. Attempting to reconnect...'
      
      // Add information about the disconnect time if available
      if (doc.disconnectedAt) {
        const disconnectedAt = new Date(doc.disconnectedAt)
        const now = new Date()
        const disconnectedSeconds = Math.floor((now.getTime() - disconnectedAt.getTime()) / 1000)
        const reconnectWindow = doc.reconnectWindow || 60
        const remainingSeconds = reconnectWindow - disconnectedSeconds
        
        if (remainingSeconds > 0) {
          description += ` ${remainingSeconds} seconds remaining before auto-disable.`
        } else {
          description += ' Reconnect window expired, stream may be auto-disabled soon.'
        }
      }
      break
    case 'completed':
      variant = 'default'
      icon = <CheckCircle2 className="h-4 w-4" />
      title = 'Stream Completed'
      description = 'Your stream has ended.'
      break
    case 'disabled':
      variant = 'destructive'
      icon = <AlertCircle className="h-4 w-4" />
      title = 'Stream Disabled'
      description = 'Your stream has been disabled due to extended downtime or manual action.'
      break
  }

  return (
    <Alert variant={variant} className="mb-6">
      <div className="flex items-center">
        {icon}
        <AlertTitle className="ml-2">{title}</AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        {description}
        <div className="text-xs mt-2 text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
          {' • '}
          <button 
            onClick={() => refreshDocument()} 
            className="underline hover:text-gray-700"
          >
            Refresh now
          </button>
          {' • '}
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)} 
            className="underline hover:text-gray-700"
          >
            {autoRefresh ? 'Disable' : 'Enable'} auto-refresh
          </button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default StreamStatusBanner
