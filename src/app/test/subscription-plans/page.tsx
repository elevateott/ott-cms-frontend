'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { clientLogger } from '@/utils/clientLogger'
import StripeCheckoutButton from '@/components/payments/StripeCheckoutButton'
import PlanPricingInfo from '@/components/payments/PlanPricingInfo'

interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  interval: 'month' | 'quarter' | 'semi-annual' | 'year'
  trialPeriodDays: number
  setupFeeAmount?: number
  isActive: boolean
  isDefault: boolean
  stripePriceId?: string
  paypalPlanId?: string
  features?: { feature: string }[]
  createdAt: string
}

export default function TestSubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [canceledMessage, setCanceledMessage] = useState<string | null>(null)

  // Check for success or canceled query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('success') === 'true') {
        setSuccessMessage('Your subscription was successful! Thank you for subscribing.')
      }
      if (params.get('canceled') === 'true') {
        setCanceledMessage('Your subscription was canceled. Please try again when you are ready.')
      }
    }
  }, [])

  // Fetch subscription plans on page load
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/subscription-plans?limit=100&where[isActive][equals]=true')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch subscription plans')
        }

        setPlans(data.docs)
      } catch (err) {
        clientLogger.error(err, 'TestSubscriptionPlansPage.fetchPlans')
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  // Get the current origin for success/cancel URLs
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Subscription Plans Test Page</h1>
      <p className="text-gray-500 mb-6">
        Test page for subscription plans with free trials and setup fees
      </p>
      
      {successMessage && (
        <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}
      
      {canceledMessage && (
        <div className="p-4 mb-6 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-600">{canceledMessage}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center">
          <p>Loading subscription plans...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-600">No active subscription plans found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.isDefault ? 'border-blue-500 border-2' : ''}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                
                <PlanPricingInfo 
                  price={plan.price}
                  interval={plan.interval}
                  trialPeriodDays={plan.trialPeriodDays}
                  setupFeeAmount={plan.setupFeeAmount || 0}
                  className="mt-2"
                />
              </CardHeader>
              
              <CardContent>
                <Separator className="mb-4" />
                
                {plan.features && plan.features.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Features</h3>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>{feature.feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-4 text-xs text-gray-500">
                  <p>
                    Payment Providers:
                    {plan.stripePriceId && plan.paypalPlanId
                      ? ' Stripe, PayPal'
                      : plan.stripePriceId
                        ? ' Stripe'
                        : plan.paypalPlanId
                          ? ' PayPal'
                          : ' None'}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter>
                {plan.stripePriceId ? (
                  <StripeCheckoutButton
                    planId={plan.id}
                    successUrl={`${origin}/test/subscription-plans?success=true`}
                    cancelUrl={`${origin}/test/subscription-plans?canceled=true`}
                    className="w-full"
                    variant={plan.isDefault ? 'default' : 'outline'}
                  >
                    {plan.trialPeriodDays > 0 
                      ? `Start ${plan.setupFeeAmount && plan.setupFeeAmount > 0 ? 'Paid' : 'Free'} Trial` 
                      : 'Subscribe Now'}
                  </StripeCheckoutButton>
                ) : (
                  <Button className="w-full" disabled>
                    Not Available
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
