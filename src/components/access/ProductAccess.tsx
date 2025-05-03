'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { clientLogger } from '@/utils/clientLogger'
import { ExternalLink, Lock, Unlock } from 'lucide-react'

const logger = clientLogger.createContextLogger('ProductAccess')

interface ProductAccessProps {
  productId: string
  productName: string
  downloadLink: string
  price: number
  children?: React.ReactNode
}

/**
 * Component to handle access control for digital products
 * 
 * Shows the product content if the user has access, or checkout options if not
 */
export const ProductAccess: React.FC<ProductAccessProps> = ({
  productId,
  productName,
  downloadLink,
  price,
  children,
}) => {
  const { isLoggedIn } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  
  // Check if the user has access to the product
  useEffect(() => {
    // If the user is not logged in, deny access
    if (!isLoggedIn) {
      setHasAccess(false)
      return
    }
    
    // Check access via API
    const checkAccess = async () => {
      try {
        setIsCheckingAccess(true)
        
        const response = await fetch(`/api/products/check-access?productId=${productId}`)
        
        if (!response.ok) {
          throw new Error('Failed to check access status')
        }
        
        const { hasAccess } = await response.json()
        setHasAccess(hasAccess)
      } catch (err) {
        logger.error('Error checking access:', err)
        // Default to no access on error
        setHasAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }
    
    checkAccess()
  }, [productId, isLoggedIn])

  // Handle purchase button click
  const handlePurchase = async () => {
    try {
      setIsCreatingCheckout(true)
      
      // Create checkout session
      const response = await fetch('/api/payments/stripe/create-product-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }
      
      const { url } = await response.json()
      
      // Redirect to checkout
      window.location.href = url
    } catch (err) {
      logger.error('Error creating checkout:', err)
    } finally {
      setIsCreatingCheckout(false)
    }
  }

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    )
  }

  // If user has access, show the content
  if (hasAccess) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-green-500" />
            {productName}
          </CardTitle>
          <CardDescription>You have access to this product</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
        <CardFooter>
          <Button asChild>
            <a href={downloadLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Access Product
            </a>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // If user doesn't have access, show purchase options
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-500" />
          {productName}
        </CardTitle>
        <CardDescription>Purchase required to access this product</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">${price.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">One-time purchase, permanent access</p>
          </div>
          {!isLoggedIn && (
            <p className="text-sm text-amber-600">You need to log in to purchase this product</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handlePurchase} 
          disabled={!isLoggedIn || isCreatingCheckout}
        >
          {isCreatingCheckout ? 'Processing...' : `Buy Now - $${price.toFixed(2)}`}
        </Button>
      </CardFooter>
    </Card>
  )
}
