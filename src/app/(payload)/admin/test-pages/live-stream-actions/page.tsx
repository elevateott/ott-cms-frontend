'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function LiveStreamActionsTest() {
  const router = useRouter()
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)
  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDoubleConfirmDialogOpen, setIsDoubleConfirmDialogOpen] = useState(false)

  // Fetch live events
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        const response = await fetch('/api/live-events')
        if (!response.ok) {
          throw new Error('Failed to fetch live events')
        }
        const data = await response.json()
        setLiveEvents(data.docs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLiveEvents()
  }, [])

  const handleSelectEvent = async (event: any) => {
    setSelectedEvent(event)
    setError(null)
    setSuccess(null)
  }

  const handleDisableStream = async () => {
    if (!selectedEvent) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/live-events/${selectedEvent.id}/disable-stream`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to disable live stream')
      }

      setSuccess('Live stream disabled successfully!')

      // Update the selected event
      const updatedEvent = { ...selectedEvent, muxStatus: 'disabled' }
      setSelectedEvent(updatedEvent)

      // Update the event in the list
      setLiveEvents(
        liveEvents.map((event) => (event.id === selectedEvent.id ? updatedEvent : event)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
      setIsDisableDialogOpen(false)
    }
  }

  const handleEnableStream = async () => {
    if (!selectedEvent) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/live-events/${selectedEvent.id}/enable-stream`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to enable live stream')
      }

      setSuccess('Live stream enabled successfully!')

      // Update the selected event
      const updatedEvent = { ...selectedEvent, muxStatus: 'idle' }
      setSelectedEvent(updatedEvent)

      // Update the event in the list
      setLiveEvents(
        liveEvents.map((event) => (event.id === selectedEvent.id ? updatedEvent : event)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
      setIsEnableDialogOpen(false)
    }
  }

  const handleDeleteStream = async () => {
    if (!selectedEvent) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/live-events/${selectedEvent.id}/delete-stream`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete live stream')
      }

      setSuccess('Live stream deleted successfully!')

      // Update the selected event
      const updatedEvent = {
        ...selectedEvent,
        muxLiveStreamId: null,
        muxStreamKey: null,
        muxPlaybackIds: [],
        muxStatus: null,
      }
      setSelectedEvent(updatedEvent)

      // Update the event in the list
      setLiveEvents(
        liveEvents.map((event) => (event.id === selectedEvent.id ? updatedEvent : event)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
      setIsDeleteDialogOpen(false)
      setIsDoubleConfirmDialogOpen(false)
    }
  }

  // Determine the status badge color
  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'gray'

    switch (status) {
      case 'active':
        return 'green'
      case 'idle':
        return 'yellow'
      case 'disabled':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Live Stream Actions Test</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
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
                        <p className="text-sm text-gray-500">ID: {event.id}</p>
                      </div>
                      {event.muxStatus && (
                        <Badge className={`bg-${getStatusColor(event.muxStatus)}-500`}>
                          {event.muxStatus}
                        </Badge>
                      )}
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
                    <Badge className={`bg-${getStatusColor(selectedEvent.muxStatus)}-500`}>
                      {selectedEvent.muxStatus}
                    </Badge>
                  )}
                </div>
                <CardDescription>Manage this live event's stream</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Stream Details</h3>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Mux Stream ID</p>
                        <p className="text-sm font-mono">
                          {selectedEvent.muxLiveStreamId || 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm">{selectedEvent.muxStatus || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Recording Enabled</p>
                        <p className="text-sm">{selectedEvent.isRecordingEnabled ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Playback Policy</p>
                        <p className="text-sm">{selectedEvent.playbackPolicy || 'public'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Stream Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.muxStatus === 'disabled' ? (
                        <Button
                          variant="outline"
                          onClick={() => setIsEnableDialogOpen(true)}
                          disabled={!selectedEvent.muxLiveStreamId}
                          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 disabled:bg-gray-100"
                        >
                          Enable Stream
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setIsDisableDialogOpen(true)}
                          disabled={
                            !selectedEvent.muxLiveStreamId || selectedEvent.muxStatus === 'disabled'
                          }
                          className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 disabled:bg-gray-100"
                        >
                          Disable Stream
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={!selectedEvent.muxLiveStreamId}
                        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 disabled:bg-gray-100"
                      >
                        Delete Stream
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

      {/* Disable Stream Dialog */}
      <AlertDialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will temporarily disable the live stream. The stream will no longer be
              broadcastable, but all metadata will be preserved. You can re-enable it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableStream}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Disable Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enable Stream Dialog */}
      <AlertDialog open={isEnableDialogOpen} onOpenChange={setIsEnableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-enable the live stream. The stream will be broadcastable again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnableStream}
              className="bg-green-500 hover:bg-green-600"
            >
              Enable Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Stream Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the live stream from Mux. This action cannot be undone.
              All stream data, including stream keys and playback IDs, will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setIsDoubleConfirmDialogOpen(true)
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Double Confirmation Dialog */}
      <AlertDialog open={isDoubleConfirmDialogOpen} onOpenChange={setIsDoubleConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. The live stream will be permanently
              deleted from Mux.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStream} className="bg-red-500 hover:bg-red-600">
              Yes, Delete Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
