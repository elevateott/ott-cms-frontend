'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'
import CheckoutOptions from '@/components/checkout/CheckoutOptions'
import { clientLogger } from '@/utils/clientLogger'

export default function TestCheckoutPage() {
  const searchParams = useSearchParams()
  const [eventId, setEventId] = useState<string>('')
  const [showCheckout, setShowCheckout] = useState<boolean>(false)
  
  // Check for success or canceled parameters
  const success = searchParams.get('success')
  const ppvSuccess = searchParams.get('ppv_success')
  const rentalSuccess = searchParams.get('rental_success')
  const canceled = searchParams.get('canceled')
  const ppvCanceled = searchParams.get('ppv_canceled')
  const rentalCanceled = searchParams.get('rental_canceled')
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (eventId) {
      setShowCheckout(true)
      clientLogger.info('Showing checkout for event', { eventId })
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Checkout UI Test Page</h1>
      
      {/* Success messages */}
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Subscription Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Your subscription has been processed successfully.
          </AlertDescription>
        </Alert>
      )}
      
      {ppvSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">PPV Purchase Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Your pay-per-view purchase has been processed successfully.
          </AlertDescription>
        </Alert>
      )}
      
      {rentalSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Rental Successful</AlertTitle>
          <AlertDescription className="text-green-700">
            Your rental has been processed successfully.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Canceled messages */}
      {(canceled || ppvCanceled || rentalCanceled) && (
        <Alert className="mb-6">
          <AlertTitle>Checkout Canceled</AlertTitle>
          <AlertDescription>
            Your checkout process was canceled. No payment was processed.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Event ID input form */}
      {!showCheckout && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Event ID</CardTitle>
            <CardDescription>
              Enter the ID of a live event to test the checkout UI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="eventId">Event ID</Label>
                <Input
                  id="eventId"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="Enter event ID"
                  required
                />
              </div>
              <Button type="submit">Show Checkout Options</Button>
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Checkout options */}
      {showCheckout && (
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowCheckout(false)}
            className="mb-4"
          >
            ← Back to Event ID Input
          </Button>
          
          <CheckoutOptions eventId={eventId} />
        </div>
      )}
      
      {/* Example event data */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Example Event IDs</CardTitle>
          <CardDescription>
            Use these example event IDs to test different checkout scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Note:</strong> You need to create events with these configurations in your CMS first.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Subscription-only event</li>
              <li>PPV-enabled event</li>
              <li>Rental-enabled event</li>
              <li>Event with multiple access options</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
