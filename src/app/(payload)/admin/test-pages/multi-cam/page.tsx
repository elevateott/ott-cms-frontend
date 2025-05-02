'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Camera } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { basicSceneCollection, advancedSceneCollection } from '@/data/obsSceneCollections'

const logger = clientLogger.createContextLogger('MultiCamTestPage')

export default function MultiCamTestPage() {
  const { toast } = useToast()
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sceneType, setSceneType] = useState<'basic' | 'advanced'>('basic')

  // Fetch live events
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/live-events?limit=100')
        const data = await response.json()
        setLiveEvents(data.docs || [])
      } catch (error) {
        logger.error('Failed to fetch live events', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveEvents()
  }, [])

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event)
  }

  const handleToggleMultiCam = async () => {
    if (!selectedEvent) return

    try {
      const response = await fetch(`/api/live-events/${selectedEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          multiCamEnabled: !selectedEvent.multiCamEnabled,
        }),
      })

      if (response.ok) {
        const updatedEvent = await response.json()
        setSelectedEvent(updatedEvent)
        
        // Update the event in the list
        setLiveEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === updatedEvent.id ? updatedEvent : event
          )
        )

        toast({
          title: 'Success',
          description: `Multi-camera mode ${updatedEvent.multiCamEnabled ? 'enabled' : 'disabled'}.`,
          duration: 3000,
        })
      } else {
        throw new Error('Failed to update event')
      }
    } catch (error) {
      logger.error('Failed to toggle multi-camera mode', error)
      toast({
        title: 'Error',
        description: 'Failed to update multi-camera settings.',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  const handleDownload = () => {
    try {
      if (!selectedEvent) {
        toast({
          title: 'No event selected',
          description: 'Please select a live event first.',
          variant: 'destructive',
        })
        return
      }

      logger.info('Downloading OBS Scene Collection', { type: sceneType })
      
      // Get the appropriate scene collection based on type
      const sceneCollection = sceneType === 'basic' ? basicSceneCollection : advancedSceneCollection
      
      // Add event-specific information
      const customizedCollection = {
        ...sceneCollection,
        name: `${selectedEvent.title || 'Live Event'} - ${sceneType === 'basic' ? 'Basic' : 'Advanced'} Multi-Cam Setup`,
        eventInfo: {
          title: selectedEvent.title || 'Live Event',
          description: selectedEvent.description || '',
          streamKey: selectedEvent.muxStreamKey || '',
          rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
        }
      }
      
      // Create and download the file
      const content = JSON.stringify(customizedCollection, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedEvent.title || 'stream'}-${sceneType}-multicam-scenes.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show toast
      toast({
        title: 'OBS Scene Collection Downloaded',
        description: `${sceneType.charAt(0).toUpperCase() + sceneType.slice(1)} multi-camera scene collection downloaded.`,
        duration: 3000,
      })
    } catch (error) {
      logger.error('Failed to download OBS Scene Collection', error)
      toast({
        title: 'Download failed',
        description: 'Failed to download OBS Scene Collection. Please try again.',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Multi-Camera Setup Test Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Live Events</CardTitle>
              <CardDescription>Select a live event to manage multi-camera settings</CardDescription>
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
                        <div className="flex gap-2 mt-1">
                          {event.multiCamEnabled && (
                            <Badge className="bg-purple-500">Multi-Cam</Badge>
                          )}
                          {event.muxStatus && (
                            <Badge
                              className={
                                event.muxStatus === 'active'
                                  ? 'bg-green-500'
                                  : event.muxStatus === 'idle'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-500'
                              }
                            >
                              {event.muxStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Camera Configuration</CardTitle>
              <CardDescription>
                Configure and download OBS Scene Collections for multi-camera streaming
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedEvent ? (
                <p>Please select a live event from the list</p>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h3 className="font-medium text-blue-800 mb-2">Event Details</h3>
                    <p className="text-sm">
                      <strong>Title:</strong> {selectedEvent.title}
                    </p>
                    {selectedEvent.description && (
                      <p className="text-sm">
                        <strong>Description:</strong> {selectedEvent.description}
                      </p>
                    )}
                    <p className="text-sm">
                      <strong>Status:</strong> {selectedEvent.muxStatus || 'Unknown'}
                    </p>
                    <p className="text-sm">
                      <strong>Multi-Camera Mode:</strong>{' '}
                      {selectedEvent.multiCamEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                    
                    <div className="mt-4">
                      <Button onClick={handleToggleMultiCam} variant="outline">
                        <Camera className="mr-2 h-4 w-4" />
                        {selectedEvent.multiCamEnabled ? 'Disable' : 'Enable'} Multi-Camera Mode
                      </Button>
                    </div>
                  </div>

                  {selectedEvent.multiCamEnabled && (
                    <>
                      <Tabs
                        defaultValue="basic"
                        className="w-full"
                        onValueChange={(value) => setSceneType(value as 'basic' | 'advanced')}
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="basic">Basic Setup (2 Cameras)</TabsTrigger>
                          <TabsTrigger value="advanced">Advanced Setup (3+ Cameras)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic">
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-sm text-gray-500 mb-4">
                                Basic multi-camera setup with 4 scenes: Camera 1, Camera 2, 
                                Picture-in-Picture, and Side-by-Side. Perfect for beginners or 
                                simple two-camera setups.
                              </p>
                              <div className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-60">
                                <h4 className="font-medium mb-2">Included Scenes:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Camera 1 (Full Screen)</li>
                                  <li>Camera 2 (Full Screen)</li>
                                  <li>Picture-in-Picture (Camera 1 large, Camera 2 small)</li>
                                  <li>Side-by-Side Split</li>
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="advanced">
                          <Card>
                            <CardContent className="pt-4">
                              <p className="text-sm text-gray-500 mb-4">
                                Advanced multi-camera setup with 8 scenes including transitions, 
                                lower thirds, and multiple layout options. Ideal for professional 
                                broadcasts with 3+ cameras.
                              </p>
                              <div className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-60">
                                <h4 className="font-medium mb-2">Included Scenes:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Starting Soon</li>
                                  <li>Camera 1 (Wide)</li>
                                  <li>Camera 2 (Close-Up)</li>
                                  <li>Camera 3 (Alternative Angle)</li>
                                  <li>Picture-in-Picture (Main + Close-Up)</li>
                                  <li>Side-by-Side Equal</li>
                                  <li>Three Camera Grid</li>
                                  <li>Stream Ending</li>
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>

                      <Button onClick={handleDownload} disabled={!selectedEvent.multiCamEnabled}>
                        <Download className="mr-2 h-4 w-4" />
                        Download {sceneType === 'basic' ? 'Basic' : 'Advanced'} Scene Collection
                      </Button>

                      <p className="text-xs text-gray-500">
                        Note: These scene collections are templates that you'll need to customize with your specific camera sources.
                        OBS Scene Collections are imported via Scene Collection → Import in OBS Studio.
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
