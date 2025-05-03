'use client'

import React, { useState } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'
import { API_ROUTES } from '@/constants/api'
import { loadStripe } from '@stripe/stripe-js'

interface StripeCheckoutButtonProps extends ButtonProps {
  planId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  children?: React.ReactNode
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  planId,
  successUrl,
  cancelUrl,
  customerEmail,
  children,
  ...props
}) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    try {
      setLoading(true)

      // Call the API to create a Stripe checkout session
      const response = await fetch(API_ROUTES.PAYMENTS.STRIPE.CREATE_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          successUrl,
          cancelUrl,
          customerEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else if (data.sessionId) {
        // If we get a session ID but no URL, use the Stripe.js redirect
        // Get the Stripe publishable key from the response
        const stripePublishableKey = data.publishableKey
        if (!stripePublishableKey) {
          throw new Error('Stripe publishable key not found')
        }

        const stripe = await loadStripe(stripePublishableKey)
        if (!stripe) {
          throw new Error('Failed to load Stripe')
        }

        await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })
      } else {
        throw new Error('No checkout URL or session ID returned')
      }
    } catch (error) {
      clientLogger.error(error, 'StripeCheckoutButton.handleClick')

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start checkout',
        variant: 'destructive',
      })

      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} {...props}>
      {loading ? 'Loading...' : children || 'Subscribe Now'}
    </Button>
  )
}

export default StripeCheckoutButton
