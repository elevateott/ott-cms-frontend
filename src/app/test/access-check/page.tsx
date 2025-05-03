'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AccessCheck } from '@/components/access/AccessCheck';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';
import { clientLogger } from '@/utils/clientLogger';

/**
 * Test page for the access check utility
 */
export default function AccessCheckTestPage() {
  const { isLoggedIn, subscriberEmail } = useAuth();
  const [eventId, setEventId] = useState('');
  const [contentId, setContentId] = useState('');
  const [selectedTab, setSelectedTab] = useState('event');
  const [isDirectCheckLoading, setIsDirectCheckLoading] = useState(false);
  const [directCheckResult, setDirectCheckResult] = useState<boolean | null>(null);
  
  // Function to check access directly via API
  const checkAccessDirectly = async () => {
    try {
      setIsDirectCheckLoading(true);
      
      // Build the query parameter based on selected tab
      const id = selectedTab === 'event' ? eventId : contentId;
      if (!id) {
        alert('Please enter an ID');
        setIsDirectCheckLoading(false);
        return;
      }
      
      const queryParam = selectedTab === 'event' 
        ? `eventId=${id}` 
        : `contentId=${id}`;
      
      const response = await fetch(`/api/access-check?${queryParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to check access status');
      }
      
      const { hasAccess } = await response.json();
      setDirectCheckResult(hasAccess);
    } catch (err) {
      clientLogger.error('Error checking access:', err);
      setDirectCheckResult(false);
    } finally {
      setIsDirectCheckLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Access Check Test</h1>
      
      {!isLoggedIn && (
        <Alert variant="destructive" className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertTitle>Not Logged In</AlertTitle>
          <AlertDescription>
            You need to log in to test access control.
          </AlertDescription>
        </Alert>
      )}
      
      {isLoggedIn && (
        <Alert className="mb-6">
          <AlertTitle>Logged In</AlertTitle>
          <AlertDescription>
            Logged in as: {subscriberEmail}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct API Check */}
        <Card>
          <CardHeader>
            <CardTitle>Direct API Check</CardTitle>
            <CardDescription>
              Test the access check API directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="event" onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="event">Event</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              
              <TabsContent value="event">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventId">Event ID</Label>
                    <Input
                      id="eventId"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      placeholder="Enter event ID"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contentId">Content ID</Label>
                    <Input
                      id="contentId"
                      value={contentId}
                      onChange={(e) => setContentId(e.target.value)}
                      placeholder="Enter content ID"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {directCheckResult !== null && (
              <div className="mt-4">
                <Alert variant={directCheckResult ? "default" : "destructive"}>
                  <AlertTitle>Access Check Result</AlertTitle>
                  <AlertDescription>
                    {directCheckResult ? "Access granted" : "Access denied"}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={checkAccessDirectly} 
              disabled={isDirectCheckLoading || !isLoggedIn}
            >
              {isDirectCheckLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Access
            </Button>
          </CardFooter>
        </Card>
        
        {/* Component Check */}
        <Card>
          <CardHeader>
            <CardTitle>Component Check</CardTitle>
            <CardDescription>
              Test the AccessCheck component
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="event">
              <TabsList className="mb-4">
                <TabsTrigger value="event">Event</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              
              <TabsContent value="event">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="componentEventId">Event ID</Label>
                    <Input
                      id="componentEventId"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      placeholder="Enter event ID"
                    />
                  </div>
                  
                  {eventId && (
                    <AccessCheck
                      eventId={eventId}
                      fallback={
                        <Alert variant="destructive">
                          <Lock className="h-4 w-4" />
                          <AlertTitle>Access Denied</AlertTitle>
                          <AlertDescription>
                            You don't have access to this event.
                          </AlertDescription>
                        </Alert>
                      }
                    >
                      <Alert>
                        <AlertTitle>Access Granted</AlertTitle>
                        <AlertDescription>
                          You have access to this event.
                        </AlertDescription>
                      </Alert>
                    </AccessCheck>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="content">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="componentContentId">Content ID</Label>
                    <Input
                      id="componentContentId"
                      value={contentId}
                      onChange={(e) => setContentId(e.target.value)}
                      placeholder="Enter content ID"
                    />
                  </div>
                  
                  {contentId && (
                    <AccessCheck
                      contentId={contentId}
                      fallback={
                        <Alert variant="destructive">
                          <Lock className="h-4 w-4" />
                          <AlertTitle>Access Denied</AlertTitle>
                          <AlertDescription>
                            You don't have access to this content.
                          </AlertDescription>
                        </Alert>
                      }
                    >
                      <Alert>
                        <AlertTitle>Access Granted</AlertTitle>
                        <AlertDescription>
                          You have access to this content.
                        </AlertDescription>
                      </Alert>
                    </AccessCheck>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
