'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice } from '@/utils/formatters'
import { DiscountCodeInput } from '@/components/payments/DiscountCodeInput'
import { clientLogger } from '@/utils/clientLogger'
import { API_ROUTES } from '@/constants/api'
import PlanRequirementMessage from '@/components/access/PlanRequirementMessage'

const logger = clientLogger.createContextLogger('ContentAccessOptions')

interface ContentAccessOptionsProps {
  /**
   * The content data
   */
  content: any
  
  /**
   * The type of content ('content' or 'event')
   */
  contentType: 'content' | 'event'
  
  /**
   * The ID of the content
   */
  contentId: string
  
  /**
   * Optional custom title to display
   */
  title?: string
  
  /**
   * Optional custom description to display
   */
  description?: string
}

/**
 * A component that displays purchase options for content
 */
export const ContentAccessOptions: React.FC<ContentAccessOptionsProps> = ({
  content,
  contentType,
  contentId,
  title,
  description,
}) => {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('subscription')
  const [ppvDiscountCode, setPpvDiscountCode] = useState<string | undefined>()
  const [rentalDiscountCode, setRentalDiscountCode] = useState<string | undefined>()
  const [isProcessingPPV, setIsProcessingPPV] = useState(false)
  const [isProcessingRental, setIsProcessingRental] = useState(false)
  
  // Determine available purchase options
  const showSubscription = content.accessType === 'subscription'
  const showPPV = content.ppvEnabled && content.ppvPrice
  const showRental = content.rentalEnabled && content.rentalPrice && content.rentalDurationHours
  
  // Set initial active tab based on available options
  React.useEffect(() => {
    if (showSubscription) {
      setActiveTab('subscription')
    } else if (showPPV) {
      setActiveTab('ppv')
    } else if (showRental) {
      setActiveTab('rental')
    }
  }, [showSubscription, showPPV, showRental])
  
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
    if (!content) return
    
    try {
      setIsProcessingPPV(true)
      
      // Create success and cancel URLs
      const successUrl = `${window.location.origin}${window.location.pathname}?ppv_success=true`
      const cancelUrl = `${window.location.origin}${window.location.pathname}?ppv_canceled=true`
      
      // Call the API to create a checkout session
      const response = await fetch(API_ROUTES.PAYMENTS.STRIPE.CREATE_PPV_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: contentId,
          successUrl,
          cancelUrl,
          discountCode: ppvDiscountCode,
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
      logger.error('Error creating PPV checkout:', err)
    } finally {
      setIsProcessingPPV(false)
    }
  }
  
  // Handle rental checkout
  const handleRentalCheckout = async () => {
    if (!content) return
    
    try {
      setIsProcessingRental(true)
      
      // Create success and cancel URLs
      const successUrl = `${window.location.origin}${window.location.pathname}?rental_success=true`
      const cancelUrl = `${window.location.origin}${window.location.pathname}?rental_canceled=true`
      
      // Call the API to create a checkout session
      const response = await fetch(API_ROUTES.PAYMENTS.STRIPE.CREATE_RENTAL_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: contentId,
          successUrl,
          cancelUrl,
          discountCode: rentalDiscountCode,
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
      logger.error('Error creating rental checkout:', err)
    } finally {
      setIsProcessingRental(false)
    }
  }
  
  // Format rental duration
  const formatRentalDuration = (hours: number) => {
    if (hours >= 24 && hours % 24 === 0) {
      const days = hours / 24
      return `${days} ${days === 1 ? 'day' : 'days'}`
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  
  // If no purchase options are available
  if (!showSubscription && !showPPV && !showRental) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || 'Content Access'}</CardTitle>
          <CardDescription>
            {description || 'This content is currently not available for purchase.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please check back later or contact support for assistance.</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Get Access to: {title || content.title}</h2>
      
      {/* Show plan requirements if this is a subscription event with required plans */}
      {showSubscription && 
       content.requiredPlans && 
       content.requiredPlans.length > 0 && (
        <PlanRequirementMessage requiredPlans={content.requiredPlans} />
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full" style={{ 
          gridTemplateColumns: `repeat(${[showSubscription, showPPV, showRental].filter(Boolean).length}, 1fr)` 
        }}>
          {showSubscription && <TabsTrigger value="subscription">Subscribe</TabsTrigger>}
          {showPPV && <TabsTrigger value="ppv">One-Time Purchase</TabsTrigger>}
          {showRental && <TabsTrigger value="rental">Rental</TabsTrigger>}
        </TabsList>
        
        {/* Subscription Option */}
        {showSubscription && (
          <TabsContent value="subscription" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>🔒 Access with Subscription</CardTitle>
                <CardDescription>Subscribe to unlock this and all premium content</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Get unlimited access to all premium content with a subscription.</p>
              </CardContent>
              <CardFooter>
                {isLoggedIn ? (
                  <Button onClick={handleSubscribeClick} className="w-full">
                    View Subscription Plans
                  </Button>
                ) : (
                  <Button onClick={handleLoginClick} className="w-full">
                    Log in to Subscribe
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        )}
        
        {/* PPV Option */}
        {showPPV && (
          <TabsContent value="ppv" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>💸 One-Time Purchase</CardTitle>
                <CardDescription>Pay once for permanent access</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{formatPrice(content.ppvPrice)}</p>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                {isLoggedIn ? (
                  <>
                    <DiscountCodeInput
                      onApply={(code) => setPpvDiscountCode(code)}
                      onClear={() => setPpvDiscountCode(undefined)}
                    />
                    <Button 
                      onClick={handlePPVCheckout} 
                      className="w-full" 
                      variant="outline"
                      disabled={isProcessingPPV}
                    >
                      {isProcessingPPV ? 'Processing...' : `Buy for ${formatPrice(content.ppvPrice)}`}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleLoginClick} className="w-full" variant="outline">
                    Log in to Purchase
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        )}
        
        {/* Rental Option */}
        {showRental && (
          <TabsContent value="rental" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>⏱ Limited-Time Rental</CardTitle>
                <CardDescription>Rent for a limited time</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {formatPrice(content.rentalPrice)} for {formatRentalDuration(content.rentalDurationHours)}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                {isLoggedIn ? (
                  <>
                    <DiscountCodeInput
                      onApply={(code) => setRentalDiscountCode(code)}
                      onClear={() => setRentalDiscountCode(undefined)}
                    />
                    <Button 
                      onClick={handleRentalCheckout} 
                      className="w-full" 
                      variant="outline"
                      disabled={isProcessingRental}
                    >
                      {isProcessingRental ? 'Processing...' : 'Rent Now'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleLoginClick} className="w-full" variant="outline">
                    Log in to Rent
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default ContentAccessOptions
