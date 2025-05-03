'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { StripeCheckoutButton } from '@/components/payments/StripeCheckoutButton'
import { StripePPVCheckoutButton } from '@/components/payments/StripePPVCheckoutButton'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { formatPrice } from '@/utils/formatters'

export default function DiscountCodesTestPage() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const [plans, setPlans] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch subscription plans
        const plansResponse = await fetch('/api/subscription-plans')
        if (!plansResponse.ok) {
          throw new Error('Failed to fetch subscription plans')
        }
        const plansData = await plansResponse.json()
        setPlans(plansData.docs.filter((plan: any) => plan.isActive))

        // Fetch live events with PPV or rental enabled
        const eventsResponse = await fetch('/api/events?limit=10')
        if (!eventsResponse.ok) {
          throw new Error('Failed to fetch events')
        }
        const eventsData = await eventsResponse.json()
        setEvents(
          eventsData.docs.filter(
            (event: any) => (event.ppvEnabled && event.ppvPrice) || (event.rentalEnabled && event.rentalPrice)
          )
        )
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Discount Codes Test Page</h1>

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Your purchase was successful. Thank you for your order!
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Canceled</AlertTitle>
          <AlertDescription>Your purchase was canceled. No charges were made.</AlertDescription>
        </Alert>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Subscription Plans with Discount</h2>
        {isLoading ? (
          <p>Loading subscription plans...</p>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : plans.length === 0 ? (
          <p>No active subscription plans found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-2xl font-bold mb-2">{formatPrice(plan.price)}</p>
                  <p className="text-sm text-gray-500 mb-4">
                    {plan.interval === 'month'
                      ? 'Monthly'
                      : plan.interval === 'year'
                      ? 'Yearly'
                      : plan.interval}
                  </p>
                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-2">
                      {plan.features.map((feature: any, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature.feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  {plan.stripePriceId ? (
                    <StripeCheckoutButton
                      planId={plan.id}
                      successUrl={`${origin}/test/discount-codes?success=true`}
                      cancelUrl={`${origin}/test/discount-codes?canceled=true`}
                      className="w-full"
                      variant={plan.isDefault ? 'default' : 'outline'}
                      showDiscountField={true}
                    >
                      {plan.trialPeriodDays > 0
                        ? `Start ${plan.setupFeeAmount && plan.setupFeeAmount > 0 ? 'Paid' : 'Free'} Trial`
                        : 'Subscribe Now'}
                    </StripeCheckoutButton>
                  ) : (
                    <p className="text-center w-full text-gray-500">Not available</p>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">PPV Events with Discount</h2>
        {isLoading ? (
          <p>Loading events...</p>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : events.filter((event) => event.ppvEnabled && event.ppvPrice).length === 0 ? (
          <p>No PPV events found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events
              .filter((event) => event.ppvEnabled && event.ppvPrice)
              .map((event) => (
                <Card key={event.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>Pay-Per-View Event</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-2xl font-bold mb-2">{formatPrice(event.ppvPrice)}</p>
                    <p className="text-sm text-gray-500 mb-4">One-time purchase</p>
                  </CardContent>
                  <CardFooter>
                    <StripePPVCheckoutButton
                      eventId={event.id}
                      successUrl={`${origin}/test/discount-codes?success=true`}
                      cancelUrl={`${origin}/test/discount-codes?canceled=true`}
                      className="w-full"
                      variant="outline"
                      showDiscountField={true}
                    >
                      Buy for {formatPrice(event.ppvPrice)}
                    </StripePPVCheckoutButton>
                  </CardFooter>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
