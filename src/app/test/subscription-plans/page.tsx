'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { clientLogger } from '@/utils/clientLogger'

interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  interval: string
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

  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`
  }

  // Format interval
  const formatInterval = (interval: string) => {
    switch (interval) {
      case 'month':
        return 'Monthly'
      case 'quarter':
        return 'Quarterly'
      case 'semi-annual':
        return 'Semi-Annual'
      case 'year':
        return 'Yearly'
      default:
        return interval
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Subscription Plans Test Page</h1>
      
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
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="text-2xl font-bold">
                    {formatPrice(plan.price)}
                    <span className="text-sm font-normal text-gray-500">
                      /{formatInterval(plan.interval).toLowerCase()}
                    </span>
                  </p>
                  
                  {plan.trialPeriodDays > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      {plan.trialPeriodDays} day free trial
                    </p>
                  )}
                  
                  {plan.setupFeeAmount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPrice(plan.setupFeeAmount)} setup fee
                    </p>
                  )}
                </div>
                
                {plan.features && plan.features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Features:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm">{feature.feature}</li>
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
                <Button className="w-full">Subscribe</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
