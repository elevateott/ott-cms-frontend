'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { clientLogger } from '@/utils/clientLogger'

const logger = clientLogger.createContextLogger('EndStreamTest')

export default function EndStreamTest() {
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)

  // Fetch live events
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/live-events')
        if (!response.ok) {
          throw new Error('Failed to fetch live events')
        }

        const data = await response.json()
        setLiveEvents(data.docs || [])
      } catch (error) {
        logger.error('Error fetching live events:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLiveEvents()
  }, [])

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event)
    setError(null)
    setSuccess(null)
  }

  // Handle end stream
  const handleEndStream = async () => {
    if (!selectedEvent) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/live-events/${selectedEvent.id}/end-stream`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to end stream')
      }

      setSuccess('Live stream ended successfully!')

      // Update the selected event
      const updatedEvent = {
        ...selectedEvent,
        muxStatus: 'completed',
        endedAt: new Date().toISOString(),
      }
      setSelectedEvent(updatedEvent)

      // Update the event in the list
      setLiveEvents(
        liveEvents.map((event) => (event.id === selectedEvent.id ? updatedEvent : event)),
      )
    } catch (error) {
      logger.error('Error ending stream:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
      setIsEndDialogOpen(false)
    }
  }

  // Get status badge color
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'gray'

    switch (status) {
      case 'active':
        return 'green'
      case 'idle':
        return 'blue'
      case 'disconnected':
        return 'yellow'
      case 'completed':
        return 'gray'
      case 'disabled':
        return 'amber'
      default:
        return 'gray'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">End Stream Test</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Success</AlertTitle>
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Live Events</CardTitle>
              <CardDescription>Select a live event to manage</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-gray-500">Loading...</p>}
              {!loading && liveEvents.length === 0 && (
                <p className="text-gray-500">No live events found</p>
              )}
              {!loading && liveEvents.length > 0 && (
                <div className="space-y-2">
                  {liveEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedEvent?.id === event.id
                          ? 'bg-blue-100 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleSelectEvent(event)}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{event.title}</h3>
                        {event.muxStatus && (
                          <Badge
                            className={`bg-${getStatusColor(event.muxStatus)}-500 hover:bg-${getStatusColor(
                              event.muxStatus,
                            )}-600`}
                          >
                            {event.muxStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedEvent ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{selectedEvent.title}</CardTitle>
                  {selectedEvent.muxStatus && (
                    <Badge
                      className={`bg-${getStatusColor(selectedEvent.muxStatus)}-500 hover:bg-${getStatusColor(
                        selectedEvent.muxStatus,
                      )}-600`}
                    >
                      {selectedEvent.muxStatus}
                    </Badge>
                  )}
                </div>
                <CardDescription>Live Event Details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Stream Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Stream ID</p>
                        <p className="font-mono text-sm">
                          {selectedEvent.muxLiveStreamId || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Stream Key</p>
                        <p className="font-mono text-sm">
                          {selectedEvent.muxStreamKey || 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.endedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">End Details</h3>
                      <div>
                        <p className="text-sm text-gray-500">Ended At</p>
                        <p className="font-mono text-sm">
                          {new Date(selectedEvent.endedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Stream Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEndDialogOpen(true)}
                        disabled={
                          !selectedEvent.muxLiveStreamId ||
                          !['active', 'disconnected'].includes(selectedEvent.muxStatus) ||
                          loading
                        }
                        className="bg-black border-gray-800 text-white hover:bg-gray-800 hover:text-white disabled:bg-gray-100"
                      >
                        {loading ? 'Processing...' : 'End Stream'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Select a live event to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end the live stream? This action cannot be undone.
              <br /><br />
              This will signal to Mux that the stream is complete, which will:
              <ul className="list-disc pl-5 mt-2">
                <li>Finalize any recording</li>
                <li>Create VOD assets immediately</li>
                <li>Prevent further streaming with the current stream key</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndStream}
              className="bg-black hover:bg-gray-800"
            >
              End Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
