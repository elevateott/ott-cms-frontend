'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

export default function PayPalWebhookTestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  
  // PPV test data
  const [ppvEmail, setPpvEmail] = useState('test@example.com')
  const [ppvEventId, setPpvEventId] = useState('')
  
  // Rental test data
  const [rentalEmail, setRentalEmail] = useState('test@example.com')
  const [rentalEventId, setRentalEventId] = useState('')
  const [rentalDurationHours, setRentalDurationHours] = useState('24')
  
  // Subscription test data
  const [subscriptionEmail, setSubscriptionEmail] = useState('test@example.com')
  const [subscriptionPlanId, setSubscriptionPlanId] = useState('')
  
  const handleTestPPV = async () => {
    if (!ppvEmail || !ppvEventId) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)
    
    try {
      // Create a mock CHECKOUT.ORDER.COMPLETED event for PPV
      const mockEvent = {
        event_type: 'CHECKOUT.ORDER.COMPLETED',
        resource: {
          id: 'test-order-id',
          status: 'COMPLETED',
          payer: {
            email_address: ppvEmail,
            payer_id: 'test-payer-id',
            name: {
              given_name: 'Test',
              surname: 'User',
            },
          },
          purchase_units: [
            {
              reference_id: 'test-reference-id',
              custom_id: JSON.stringify({
                type: 'ppv',
                eventId: ppvEventId,
              }),
            },
          ],
        },
      }
      
      // Send the mock event to the webhook handler
      const response = await fetch('/api/webhooks/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'paypal-auth-algo': 'test-webhook-id', // Mock header for validation
        },
        body: JSON.stringify(mockEvent),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'PayPal PPV webhook test completed successfully',
        })
        setResult(JSON.stringify(data, null, 2))
      } else {
        toast({
          title: 'Error',
          description: data.error || 'An error occurred',
          variant: 'destructive',
        })
        setResult(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
      setResult(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }, null, 2))
    } finally {
      setLoading(false)
    }
  }
  
  const handleTestRental = async () => {
    if (!rentalEmail || !rentalEventId || !rentalDurationHours) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)
    
    try {
      // Create a mock CHECKOUT.ORDER.COMPLETED event for rental
      const mockEvent = {
        event_type: 'CHECKOUT.ORDER.COMPLETED',
        resource: {
          id: 'test-order-id',
          status: 'COMPLETED',
          payer: {
            email_address: rentalEmail,
            payer_id: 'test-payer-id',
            name: {
              given_name: 'Test',
              surname: 'User',
            },
          },
          purchase_units: [
            {
              reference_id: 'test-reference-id',
              custom_id: JSON.stringify({
                type: 'rental',
                eventId: rentalEventId,
                durationHours: parseInt(rentalDurationHours, 10),
              }),
            },
          ],
        },
      }
      
      // Send the mock event to the webhook handler
      const response = await fetch('/api/webhooks/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'paypal-auth-algo': 'test-webhook-id', // Mock header for validation
        },
        body: JSON.stringify(mockEvent),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'PayPal rental webhook test completed successfully',
        })
        setResult(JSON.stringify(data, null, 2))
      } else {
        toast({
          title: 'Error',
          description: data.error || 'An error occurred',
          variant: 'destructive',
        })
        setResult(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
      setResult(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }, null, 2))
    } finally {
      setLoading(false)
    }
  }
  
  const handleTestSubscription = async () => {
    if (!subscriptionEmail || !subscriptionPlanId) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)
    
    try {
      // Create a mock BILLING.SUBSCRIPTION.ACTIVATED event
      const mockEvent = {
        event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
        resource: {
          id: 'test-subscription-id',
          status: 'ACTIVE',
          plan_id: 'test-plan-id',
          custom_id: JSON.stringify({
            planId: subscriptionPlanId,
          }),
          subscriber: {
            payer: {
              email_address: subscriptionEmail,
              payer_id: 'test-payer-id',
              name: {
                given_name: 'Test',
                surname: 'User',
              },
            },
          },
          billing_info: {
            next_billing_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          },
        },
      }
      
      // Send the mock event to the webhook handler
      const response = await fetch('/api/webhooks/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'paypal-auth-algo': 'test-webhook-id', // Mock header for validation
        },
        body: JSON.stringify(mockEvent),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'PayPal subscription webhook test completed successfully',
        })
        setResult(JSON.stringify(data, null, 2))
      } else {
        toast({
          title: 'Error',
          description: data.error || 'An error occurred',
          variant: 'destructive',
        })
        setResult(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
      setResult(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }, null, 2))
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">PayPal Webhook Test</h1>
      <p className="text-gray-500 mb-6">
        Use this page to test the PayPal webhook handler for different purchase types.
      </p>
      
      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="ppv">
          <TabsList className="mb-4">
            <TabsTrigger value="ppv">PPV Purchase</TabsTrigger>
            <TabsTrigger value="rental">Rental Purchase</TabsTrigger>
            <TabsTrigger value="subscription">Subscription Purchase</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ppv">
            <Card>
              <CardHeader>
                <CardTitle>Test PayPal PPV Purchase Webhook</CardTitle>
                <CardDescription>
                  Simulate a completed checkout for a PPV purchase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ppv-email">Customer Email</Label>
                  <Input
                    id="ppv-email"
                    value={ppvEmail}
                    onChange={(e) => setPpvEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ppv-event-id">Event ID</Label>
                  <Input
                    id="ppv-event-id"
                    value={ppvEventId}
                    onChange={(e) => setPpvEventId(e.target.value)}
                    placeholder="Enter a valid live event ID"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleTestPPV} disabled={loading}>
                  {loading ? 'Processing...' : 'Test PayPal PPV Webhook'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="rental">
            <Card>
              <CardHeader>
                <CardTitle>Test PayPal Rental Purchase Webhook</CardTitle>
                <CardDescription>
                  Simulate a completed checkout for a rental purchase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rental-email">Customer Email</Label>
                  <Input
                    id="rental-email"
                    value={rentalEmail}
                    onChange={(e) => setRentalEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental-event-id">Event ID</Label>
                  <Input
                    id="rental-event-id"
                    value={rentalEventId}
                    onChange={(e) => setRentalEventId(e.target.value)}
                    placeholder="Enter a valid live event ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rental-duration">Duration (hours)</Label>
                  <Input
                    id="rental-duration"
                    value={rentalDurationHours}
                    onChange={(e) => setRentalDurationHours(e.target.value)}
                    placeholder="24"
                    type="number"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleTestRental} disabled={loading}>
                  {loading ? 'Processing...' : 'Test PayPal Rental Webhook'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Test PayPal Subscription Purchase Webhook</CardTitle>
                <CardDescription>
                  Simulate a subscription activation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription-email">Customer Email</Label>
                  <Input
                    id="subscription-email"
                    value={subscriptionEmail}
                    onChange={(e) => setSubscriptionEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscription-plan-id">Plan ID</Label>
                  <Input
                    id="subscription-plan-id"
                    value={subscriptionPlanId}
                    onChange={(e) => setSubscriptionPlanId(e.target.value)}
                    placeholder="Enter a valid subscription plan ID"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleTestSubscription} disabled={loading}>
                  {loading ? 'Processing...' : 'Test PayPal Subscription Webhook'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={result}
                readOnly
                className="font-mono h-60"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
