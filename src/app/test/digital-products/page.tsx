'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { clientLogger } from '@/utils/clientLogger'

const logger = clientLogger.createContextLogger('DigitalProductsTest')

export default function DigitalProductsTestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [productId, setProductId] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Load digital products on page load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const response = await fetch('/api/digital-products?limit=100')
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }
        const data = await response.json()
        setProducts(data.docs || [])
      } catch (error) {
        logger.error('Error fetching products:', error)
        toast({
          title: 'Error',
          description: 'Failed to load digital products',
          variant: 'destructive',
        })
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [toast])

  const handleCreateCheckout = async () => {
    if (!productId) {
      toast({
        title: 'Missing product',
        description: 'Please select a digital product',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Create checkout session
      const response = await fetch('/api/payments/stripe/create-product-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          customerEmail: customerEmail || undefined,
          discountCode: discountCode || undefined,
          successUrl: `${window.location.origin}/test/digital-products?success=true`,
          cancelUrl: `${window.location.origin}/test/digital-products?canceled=true`,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to checkout
      window.location.href = url
    } catch (error) {
      logger.error('Error creating checkout:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Check for success or canceled query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      toast({
        title: 'Success!',
        description: 'Your purchase was successful.',
        variant: 'default',
      })
    } else if (params.get('canceled') === 'true') {
      toast({
        title: 'Canceled',
        description: 'Your purchase was canceled.',
        variant: 'destructive',
      })
    }
  }, [toast])

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Digital Products Test</h1>
      <p className="text-muted-foreground mb-8">
        This page allows you to test the digital products checkout flow.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Checkout Session</CardTitle>
            <CardDescription>
              Create a Stripe checkout session for a digital product purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <select
                id="productId"
                className="w-full p-2 border rounded"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={loadingProducts}
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (${product.price})
                  </option>
                ))}
              </select>
              {loadingProducts && <p className="text-sm text-muted-foreground">Loading products...</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Customer Email (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountCode">Discount Code (Optional)</Label>
              <Input
                id="discountCode"
                placeholder="DISCOUNT10"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateCheckout} disabled={loading || !productId}>
              {loading ? 'Creating Checkout...' : 'Create Checkout Session'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>How to test digital products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Step 1: Create a Digital Product</h3>
              <p className="text-sm text-muted-foreground">
                Go to the admin panel and create a digital product with a price and download URL.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium">Step 2: Create a Checkout Session</h3>
              <p className="text-sm text-muted-foreground">
                Select the product from the dropdown and click &quot;Create Checkout Session&quot;.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium">Step 3: Complete the Purchase</h3>
              <p className="text-sm text-muted-foreground">
                Use Stripe test card 4242 4242 4242 4242 with any future expiration date and any CVC.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium">Step 4: Verify Access</h3>
              <p className="text-sm text-muted-foreground">
                After purchase, check the subscriber record in the admin panel to verify the product was added.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
