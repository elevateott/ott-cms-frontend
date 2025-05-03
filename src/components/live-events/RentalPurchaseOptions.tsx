'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/utils/formatters'
import { API_ROUTES } from '@/constants/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

interface RentalPurchaseOptionsProps {
  event: {
    id: string
    title: string
    rentalPrice: number
    rentalDurationHours: number
  }
}

const RentalPurchaseOptions: React.FC<RentalPurchaseOptionsProps> = ({ event }) => {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const formattedPrice = formatPrice(event.rentalPrice)
  const durationText = event.rentalDurationHours >= 24 
    ? `${event.rentalDurationHours / 24} days` 
    : `${event.rentalDurationHours} hours`

  const handleLoginClick = () => {
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
  }

  const handlePurchaseClick = async () => {
    try {
      setIsLoading(true)

      // Create the success and cancel URLs
      const successUrl = `${window.location.origin}/events/${event.id}?rental_success=true`
      const cancelUrl = `${window.location.origin}/events/${event.id}?rental_canceled=true`

      // Call the API to create a Stripe checkout session
      const response = await fetch(API_ROUTES.PAYMENTS.STRIPE.CREATE_RENTAL_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          successUrl,
          cancelUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to the Stripe checkout page
      window.location.href = url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: 'Error',
        description: 'Failed to create checkout session. Please try again.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
      <h3 className="text-amber-800 font-medium">Rental Access</h3>
      <p className="text-amber-700 text-sm mt-1 mb-4">
        Rent this event for {formattedPrice} and get {durationText} of access.
      </p>
      
      {isLoggedIn ? (
        <Button
          onClick={handlePurchaseClick}
          disabled={isLoading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isLoading ? 'Processing...' : `Rent for ${formattedPrice} (${durationText})`}
        </Button>
      ) : (
        <Button
          onClick={handleLoginClick}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          Log in to rent
        </Button>
      )}
    </div>
  )
}

export default RentalPurchaseOptions
