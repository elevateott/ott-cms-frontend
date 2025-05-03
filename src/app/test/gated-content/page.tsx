'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { clientLogger } from '@/utils/clientLogger'
import { Loader2 } from 'lucide-react'
import { GatedContentWrapper } from '@/components/access/GatedContentWrapper'
import { VideoPlayer } from '@/components/VideoPlayer'

const logger = clientLogger.createContextLogger('GatedContentTest')

export default function GatedContentTestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [content, setContent] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedContentId, setSelectedContentId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('events')
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  // Load events and content on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch events
        const eventsResponse = await fetch('/api/live-events?limit=10')
        const eventsData = await eventsResponse.json()
        
        // Fetch content
        const contentResponse = await fetch('/api/content?limit=10')
        const contentData = await contentResponse.json()
        
        setEvents(eventsData.docs || [])
        setContent(contentData.docs || [])
        
        // Set default selections if available
        if (eventsData.docs && eventsData.docs.length > 0) {
          setSelectedEventId(eventsData.docs[0].id)
        }
        
        if (contentData.docs && contentData.docs.length > 0) {
          setSelectedContentId(contentData.docs[0].id)
        }
      } catch (error) {
        logger.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Handle access change
  const handleAccessChange = (access: boolean) => {
    setHasAccess(access)
    
    toast({
      title: access ? 'Access Granted' : 'Access Denied',
      description: access 
        ? 'You have access to this content' 
        : 'You do not have access to this content',
      variant: access ? 'default' : 'destructive',
    })
  }

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading data...</span>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Gated Content Test</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates how the GatedContentWrapper component works to control access to content.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              Understanding the gated content wrapper
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">1. Access Check</h3>
              <p className="text-sm text-muted-foreground">
                The component checks if the current user has access to the content.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium">2. Dynamic Rendering</h3>
              <p className="text-sm text-muted-foreground">
                If the user has access, the content is displayed. Otherwise, purchase options are shown.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium">3. Purchase Options</h3>
              <p className="text-sm text-muted-foreground">
                The component shows appropriate purchase options based on the content type.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Current Access Status: {' '}
              {hasAccess === null ? 'Unknown' : hasAccess ? 'Granted ✅' : 'Denied 🔒'}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Content</CardTitle>
            <CardDescription>
              Choose content to test the gated wrapper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="events">Live Events</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              
              <TabsContent value="events" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventSelect">Select an event:</Label>
                  <select
                    id="eventSelect"
                    className="w-full p-2 border rounded"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({event.accessType})
                      </option>
                    ))}
                  </select>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contentSelect">Select content:</Label>
                  <select
                    id="contentSelect"
                    className="w-full p-2 border rounded"
                    value={selectedContentId}
                    onChange={(e) => setSelectedContentId(e.target.value)}
                  >
                    <option value="">Select content</option>
                    {content.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6">Gated Content Demo</h2>
        
        {activeTab === 'events' && selectedEventId ? (
          <GatedContentWrapper 
            eventId={selectedEventId}
            onAccessChange={handleAccessChange}
          >
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">Event Content</h3>
                  <p>This is the actual event content that would be shown to users with access.</p>
                </div>
              </div>
            </div>
          </GatedContentWrapper>
        ) : activeTab === 'content' && selectedContentId ? (
          <GatedContentWrapper 
            contentId={selectedContentId}
            onAccessChange={handleAccessChange}
          >
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Content Video</h3>
                    <p>This is the actual content that would be shown to users with access.</p>
                  </div>
                </div>
              </div>
              <div className="prose max-w-none">
                <h3>Content Description</h3>
                <p>
                  This is additional content that would be shown to users with access.
                  It could include text, images, or other media.
                </p>
              </div>
            </div>
          </GatedContentWrapper>
        ) : (
          <Card>
            <CardContent className="py-10">
              <p className="text-center text-muted-foreground">
                Please select an event or content item to test the gated content wrapper.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
