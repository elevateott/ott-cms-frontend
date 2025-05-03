'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { API_ROUTES } from '@/constants/api'
import { CurrencyPrice } from '@/components/ui/CurrencyPrice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface AddOn {
  id: string
  title: string
  description: string
  type: 'one-time' | 'recurring'
  pricesByCurrency: Array<{ currency: string; amount: number }>
  isActive: boolean
}

interface AddOnsListProps {
  subscriberId?: string
  purchasedAddOns?: string[]
  activeRecurringAddOns?: Array<{ addon: { id: string } }>
  onSuccess?: () => void
}

export function AddOnsList({ 
  subscriberId, 
  purchasedAddOns = [], 
  activeRecurringAddOns = [],
  onSuccess 
}: AddOnsListProps) {
  const [addons, setAddons] = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Get list of purchased add-on IDs
  const purchasedOneTimeAddOnIds = purchasedAddOns || []
  const activeRecurringAddOnIds = (activeRecurringAddOns || [])
    .filter(item => item.addon)
    .map(item => item.addon.id)

  // Check if an add-on is already purchased
  const isAddOnPurchased = (addon: AddOn) => {
    if (addon.type === 'one-time') {
      return purchasedOneTimeAddOnIds.includes(addon.id)
    } else {
      return activeRecurringAddOnIds.includes(addon.id)
    }
  }

  // Fetch add-ons
  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/addons')
        
        if (!response.ok) {
          throw new Error('Failed to fetch add-ons')
        }
        
        const data = await response.json()
        setAddons(data.docs || [])
      } catch (error) {
        console.error('Error fetching add-ons:', error)
        toast({
          title: 'Error',
          description: 'Failed to load available add-ons',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchAddOns()
  }, [toast])

  // Handle add-on purchase
  const handlePurchase = async (addon: AddOn) => {
    try {
      setProcessingId(addon.id)
      
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
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (addons.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No add-ons are currently available.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {addons
        .filter(addon => addon.isActive)
        .map(addon => (
          <Card key={addon.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{addon.title}</CardTitle>
                <Badge variant={addon.type === 'one-time' ? 'outline' : 'secondary'}>
                  {addon.type === 'one-time' ? 'One-Time' : 'Monthly'}
                </Badge>
              </div>
              <CardDescription>{addon.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-2xl font-bold">
                <CurrencyPrice 
                  pricesByCurrency={addon.pricesByCurrency} 
                  fallbackPrice={0}
                />
                {addon.type === 'recurring' && <span className="text-sm font-normal">/month</span>}
              </div>
            </CardContent>
            <CardFooter>
              {isAddOnPurchased(addon) ? (
                <Button variant="outline" disabled className="w-full">
                  {addon.type === 'one-time' ? 'Purchased' : 'Active'}
                </Button>
              ) : (
                <Button 
                  onClick={() => handlePurchase(addon)} 
                  disabled={processingId === addon.id}
                  className="w-full"
                >
                  {processingId === addon.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Purchase${addon.type === 'recurring' ? ' Subscription' : ''}`
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
    </div>
  )
}

export default AddOnsList
