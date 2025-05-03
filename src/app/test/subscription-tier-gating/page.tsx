'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { clientLogger } from '@/utils/clientLogger'
import { Loader2 } from 'lucide-react'
import PlanRequirementMessage from '@/components/access/PlanRequirementMessage'

const logger = clientLogger.createContextLogger('SubscriptionTierGatingTest')

export default function SubscriptionTierGatingTestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [content, setContent] = useState<any[]>([])

  // Load subscription plans, events, and content on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch subscription plans
        const plansResponse = await fetch('/api/subscription-plans?limit=100&where[isActive][equals]=true')
        const plansData = await plansResponse.json()
        
        // Fetch events with required plans
        const eventsResponse = await fetch('/api/live-events?limit=10&where[requiredPlans][exists]=true')
        const eventsData = await eventsResponse.json()
        
        // Fetch content with required plans
        const contentResponse = await fetch('/api/content?limit=10&where[requiredPlans][exists]=true')
        const contentData = await contentResponse.json()
        
        setPlans(plansData.docs || [])
        setEvents(eventsData.docs || [])
        setContent(contentData.docs || [])
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
      <h1 className="text-3xl font-bold mb-6">Subscription Tier Gating Test</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates how subscription tier gating works in the OTT platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Available Subscription Plans</CardTitle>
            <CardDescription>
              These plans can be used to gate access to content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <p className="text-muted-foreground">No active subscription plans found.</p>
            ) : (
              <ul className="space-y-2">
                {plans.map((plan) => (
                  <li key={plan.id} className="p-3 border rounded">
                    <div className="font-medium">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">${(plan.price / 100).toFixed(2)} / {plan.interval}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How Tier Gating Works</CardTitle>
            <CardDescription>
              Understanding subscription tier gating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">1. Assign Plans to Content</h3>
              <p className="text-sm text-muted-foreground">
                Admins can assign specific subscription plans to content or events.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium">2. Access Control</h3>
              <p className="text-sm text-muted-foreground">
                Only subscribers with the required plan(s) can access the content.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium">3. Fallback Options</h3>
              <p className="text-sm text-muted-foreground">
                PPV, rentals, and manual access overrides still work as alternative access methods.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Gated Events</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground mb-8">No events with plan requirements found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  {event.accessType === 'subscription' ? 'Subscription Required' : event.accessType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {event.requiredPlans && event.requiredPlans.length > 0 && (
                  <PlanRequirementMessage requiredPlans={event.requiredPlans} />
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => window.location.href = `/events/${event.slug}`}>
                  View Event
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Gated Content</h2>
      {content.length === 0 ? (
        <p className="text-muted-foreground">No content with plan requirements found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                  {item.isFree ? 'Free Content' : 'Subscription Required'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item.requiredPlans && item.requiredPlans.length > 0 && (
                  <PlanRequirementMessage requiredPlans={item.requiredPlans} />
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => window.location.href = `/content/${item.slug}`}>
                  View Content
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
