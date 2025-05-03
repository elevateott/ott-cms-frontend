'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { API_ROUTES } from '@/constants/api'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface Event {
  id: string
  title: string
  description?: string
  // Access types
  accessType: 'free' | 'subscription' | 'paid_ticket'
  // PPV fields
  ppvEnabled: boolean
  ppvPrice?: number
  // Rental fields
  rentalEnabled: boolean
  rentalPrice?: number
  rentalDurationHours?: number
}

interface CheckoutOptionsProps {
  eventId: string
}

export const CheckoutOptions = ({ eventId }: CheckoutOptionsProps) => {
  const { isLoggedIn, subscriberId } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [accessStatus, setAccessStatus] = useState<'loading' | 'hasAccess' | 'noAccess'>('loading')
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)
  const [isLoadingEvent, setIsLoadingEvent] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoadingEvent(true)
        setError(null)
        
        const response = await fetch(`/api/events/${eventId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch event data')
        }
        
        const eventData = await response.json()
        setEvent(eventData)
      } catch (err) {
        clientLogger.error('Error fetching event data:', err)
        setError('Failed to load event data. Please try again.')
      } finally {
        setIsLoadingEvent(false)
      }
    }
    
    fetchEvent()
  }, [eventId])

  // Check access status if user is logged in
  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoggedIn || !subscriberId || !eventId) {
        setAccessStatus('noAccess')
        return
      }
      
      try {
        setIsCheckingAccess(true)
        
        const response = await fetch('/api/subscribers/check-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriberId,
            eventId,
          }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to check access status')
        }
        
        const { hasAccess } = await response.json()
        setAccessStatus(hasAccess ? 'hasAccess' : 'noAccess')
      } catch (err) {
        clientLogger.error('Error checking access:', err)
        // Default to no access on error
        setAccessStatus('noAccess')
      } finally {
        setIsCheckingAccess(false)
      }
    }
    
    checkAccess()
  }, [isLoggedIn, subscriberId, eventId])

  // Handle login click
  const handleLoginClick = () => {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
  }

  // Handle subscription click
  const handleSubscribeClick = () => {
    router.push('/subscribe')
  }

  // Handle PPV checkout
  const handlePPVCheckout = async () => {
    if (!event) return
    
    try {
      // Create success and cancel URLs
      const successUrl = `${window.location.origin}/events/${eventId}?ppv_success=true`
      const cancelUrl = `${window.location.origin}/events/${eventId}?ppv_canceled=true`
      
      // Call the API to create a checkout session
      const response = await fetch(API_ROUTES.PAYMENTS.STRIPE.CREATE_PPV_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          successUrl,
          cancelUrl,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }
      
      const { url } = await response.json()
      
      // Redirect to the checkout page
      window.location.href = url
    } catch (err) {
      clientLogger.error('Error creating PPV checkout:', err)
      toast({
        title: 'Error',
        description: 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle rental checkout
  const handleRentalCheckout = async () => {
    if (!event) return
    
    try {
      // Create success and cancel URLs
      const successUrl = `${window.location.origin}/events/${eventId}?rental_success=true`
      const cancelUrl = `${window.location.origin}/events/${eventId}?rental_canceled=true`
      
      // Call the API to create a checkout session
      const response = await fetch(API_ROUTES.PAYMENTS.STRIPE.CREATE_RENTAL_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          successUrl,
          cancelUrl,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }
      
      const { url } = await response.json()
      
      // Redirect to the checkout page
      window.location.href = url
    } catch (err) {
      clientLogger.error('Error creating rental checkout:', err)
      toast({
        title: 'Error',
        description: 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Loading state
  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading event details...</span>
      </div>
    )
  }

  // Error state
  if (error || !event) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error || 'Failed to load event details. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  // User already has access
  if (accessStatus === 'hasAccess') {
    return (
      <Alert className="mb-6 bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">You have access</AlertTitle>
        <AlertDescription className="text-green-700">
          You already have access to this event. Enjoy watching!
        </AlertDescription>
      </Alert>
    )
  }

  // Free event
  if (event.accessType === 'free') {
    return (
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Free Event</AlertTitle>
        <AlertDescription className="text-blue-700">
          This is a free event. No purchase required.
        </AlertDescription>
      </Alert>
    )
  }

  // Render checkout options
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Get Access to: {event.title}</h2>
      
      {/* Subscription Option */}
      {event.accessType === 'subscription' && (
        <Card>
          <CardHeader>
            <CardTitle>🔒 Access with Subscription</CardTitle>
            <CardDescription>
              Subscribe to unlock this and all premium content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Get unlimited access to all premium content with a subscription.</p>
          </CardContent>
          <CardFooter>
            {isLoggedIn ? (
              <Button 
                onClick={handleSubscribeClick} 
                className="w-full"
              >
                View Subscription Plans
              </Button>
            ) : (
              <Button 
                onClick={handleLoginClick} 
                className="w-full"
              >
                Log in to Subscribe
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
      
      {/* PPV Option */}
      {event.ppvEnabled && event.ppvPrice && (
        <Card>
          <CardHeader>
            <CardTitle>💸 One-Time Purchase (PPV)</CardTitle>
            <CardDescription>
              Pay once for permanent access to this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{formatPrice(event.ppvPrice)}</p>
          </CardContent>
          <CardFooter>
            {isLoggedIn ? (
              <Button 
                onClick={handlePPVCheckout} 
                className="w-full"
                variant="outline"
              >
                Buy for {formatPrice(event.ppvPrice)}
              </Button>
            ) : (
              <Button 
                onClick={handleLoginClick} 
                className="w-full"
                variant="outline"
              >
                Log in to Purchase
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
      
      {/* Rental Option */}
      {event.rentalEnabled && event.rentalPrice && event.rentalDurationHours && (
        <Card>
          <CardHeader>
            <CardTitle>⏱ Limited-Time Rental</CardTitle>
            <CardDescription>
              Rent this event for a limited time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {formatPrice(event.rentalPrice)} for {event.rentalDurationHours >= 24 
                ? `${event.rentalDurationHours / 24} days` 
                : `${event.rentalDurationHours} hours`}
            </p>
          </CardContent>
          <CardFooter>
            {isLoggedIn ? (
              <Button 
                onClick={handleRentalCheckout} 
                className="w-full"
                variant="outline"
              >
                Rent Now
              </Button>
            ) : (
              <Button 
                onClick={handleLoginClick} 
                className="w-full"
                variant="outline"
              >
                Log in to Rent
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

export default CheckoutOptions
