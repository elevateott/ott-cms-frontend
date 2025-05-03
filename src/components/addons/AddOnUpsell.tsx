'use client'

import React, { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { API_ROUTES } from '@/constants/api'
import { CurrencyPrice } from '@/components/ui/CurrencyPrice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, X } from 'lucide-react'

interface AddOn {
  id: string
  title: string
  description: string
  type: 'one-time' | 'recurring'
  pricesByCurrency: Array<{ currency: string; amount: number }>
}

interface AddOnUpsellProps {
  addon: AddOn
  onDismiss?: () => void
  onSuccess?: () => void
  isPurchased?: boolean
}

export function AddOnUpsell({ 
  addon, 
  onDismiss, 
  onSuccess,
  isPurchased = false
}: AddOnUpsellProps) {
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  // Handle add-on purchase
  const handlePurchase = async () => {
    try {
      setProcessing(true)
      
      // Create success and cancel URLs
      const successUrl = `${window.location.origin}/account?addon_success=true`
      const cancelUrl = `${window.location.origin}/account?addon_canceled=true`
      
      // Call the API to create a checkout session
      const response = await fetch(API_ROUTES.PAYMENTS.STRIPE.CREATE_ADDON_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addonId: addon.id,
          successUrl,
          cancelUrl,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }
      
      const data = await response.json()
      
      // Redirect to Stripe checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process purchase',
        variant: 'destructive',
      })
      setProcessing(false)
    }
  }

  return (
    <Card className="relative border-primary/20 shadow-md">
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <CardTitle>{addon.title}</CardTitle>
          <Badge variant={addon.type === 'one-time' ? 'outline' : 'secondary'}>
            {addon.type === 'one-time' ? 'One-Time' : 'Monthly'}
          </Badge>
        </div>
        <CardDescription>{addon.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <CurrencyPrice 
            pricesByCurrency={addon.pricesByCurrency} 
            fallbackPrice={0}
          />
          {addon.type === 'recurring' && <span className="text-sm font-normal">/month</span>}
        </div>
      </CardContent>
      <CardFooter>
        {isPurchased ? (
          <Button variant="outline" disabled className="w-full">
            {addon.type === 'one-time' ? 'Purchased' : 'Active'}
          </Button>
        ) : (
          <Button 
            onClick={handlePurchase} 
            disabled={processing}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Add to My Account`
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default AddOnUpsell
