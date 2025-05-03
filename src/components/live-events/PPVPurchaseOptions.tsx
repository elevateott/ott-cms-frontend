'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { StripePPVCheckoutButton } from '@/components/payments'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

interface PPVPurchaseOptionsProps {
  event: {
    id: string
    title: string
    ppvEnabled: boolean
    ppvPrice: number
  }
  subscriberId?: string
  hasPurchased?: boolean
}

const PPVPurchaseOptions: React.FC<PPVPurchaseOptionsProps> = ({ 
  event, 
  subscriberId,
  hasPurchased = false
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggedIn, setIsLoggedIn] = useState(!!subscriberId)
  
  // Format price for display
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(event.ppvPrice / 100)
  
  // Generate success and cancel URLs
  const successUrl = `${window.location.origin}/events/${event.id}/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${window.location.origin}/events/${event.id}`
  
  // Handle login click
  const handleLoginClick = () => {
    // Store the current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', window.location.pathname)
    router.push('/login')
  }
  
  // If the event doesn't have PPV enabled, don't render anything
  if (!event.ppvEnabled) {
    return null
  }
  
  // If the user has already purchased this event, show a success message
  if (hasPurchased) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
        <h3 className="text-green-800 font-medium">You have access to this event</h3>
        <p className="text-green-700 text-sm mt-1">
          You've already purchased access to this pay-per-view event.
        </p>
      </div>
    )
  }
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
      <h3 className="text-amber-800 font-medium">Pay-Per-View Event</h3>
      <p className="text-amber-700 text-sm mt-1 mb-4">
        This is a pay-per-view event. Purchase access for {formattedPrice} to watch.
      </p>
      
      {isLoggedIn ? (
        <StripePPVCheckoutButton
          eventId={event.id}
          successUrl={successUrl}
          cancelUrl={cancelUrl}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          Purchase for {formattedPrice}
        </StripePPVCheckoutButton>
      ) : (
        <button
          onClick={handleLoginClick}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded"
        >
          Log in to purchase
        </button>
      )}
    </div>
  )
}

export default PPVPurchaseOptions
