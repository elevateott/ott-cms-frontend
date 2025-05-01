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

const logger = clientLogger.createContextLogger('ResetStreamKeyTest')

export default function ResetStreamKeyTest() {
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [oldStreamKey, setOldStreamKey] = useState<string | null>(null)
  const [newStreamKey, setNewStreamKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
    setOldStreamKey(null)
    setNewStreamKey(null)
  }

  // Handle reset stream key
  const handleResetStreamKey = async () => {
    if (!selectedEvent) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      setOldStreamKey(selectedEvent.muxStreamKey)

      const response = await fetch(`/api/live-events/${selectedEvent.id}/reset-stream-key`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reset stream key')
      }

      const data = await response.json()
      setNewStreamKey(data.streamKey)
      setSuccess('Stream key reset successfully!')

      // Update the selected event
      const updatedEvent = {
        ...selectedEvent,
        muxStreamKey: data.streamKey,
      }
      setSelectedEvent(updatedEvent)

      // Update the event in the list
      setLiveEvents(
        liveEvents.map((event) => (event.id === selectedEvent.id ? updatedEvent : event)),
      )

      // Copy to clipboard
      await navigator.clipboard.writeText(data.streamKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (error) {
      logger.error('Error resetting stream key:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
      setIsResetDialogOpen(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (newStreamKey) {
      try {
        await navigator.clipboard.writeText(newStreamKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
        setSuccess('Stream key copied to clipboard!')
      } catch (error) {
        logger.error('Error copying to clipboard:', error)
        setError('Failed to copy to clipboard')
      }
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
      case 'disabled':
        return 'amber'
      default:
        return 'gray'
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Reset Stream Key Test</h1>

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

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Stream Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsResetDialogOpen(true)}
                        disabled={
                          !selectedEvent.muxLiveStreamId ||
                          selectedEvent.muxStatus === 'disabled' ||
                          loading
                        }
                        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800 disabled:bg-gray-100"
                      >
                        {loading ? 'Processing...' : 'Reset Stream Key'}
                      </Button>
                    </div>
                  </div>

                  {oldStreamKey && newStreamKey && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                      <h4 className="text-sm font-medium mb-2">Stream Key Updated</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Old Key:</span> {oldStreamKey}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-1">New Key:</span> {newStreamKey}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-6 w-6 p-0"
                            onClick={copyToClipboard}
                          >
                            {copied ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                />
                              </svg>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
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

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Stream Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the current stream key and generate a new one. You will need to
              update your streaming software with the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetStreamKey}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Reset Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
