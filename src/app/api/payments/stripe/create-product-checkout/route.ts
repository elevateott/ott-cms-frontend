import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

/**
 * POST /api/payments/stripe/create-product-checkout
 * 
 * Create a Stripe checkout session for a digital product purchase
 * 
 * Request body:
 * - productId: ID of the digital product to purchase
 * - successUrl: URL to redirect to on successful payment
 * - cancelUrl: URL to redirect to on cancelled payment
 * - customerEmail: (Optional) Pre-fill the customer's email
 * - discountCode: (Optional) Discount code to apply
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const {
      productId,
      successUrl,
      cancelUrl,
      customerEmail,
      discountCode,
    } = await request.json()

    // Validate required fields
    if (!productId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get payment settings
    const settings = await getPaymentSettings()

    // Check if Stripe is enabled
    if (!settings.stripe.enabled) {
      return NextResponse.json(
        { error: 'Stripe payments are not enabled' },
        { status: 400 }
      )
    }

    // Get the digital product
    const product = await payload.findByID({
      collection: 'digital-products',
      id: productId,
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.stripePriceId) {
      return NextResponse.json(
        { error: 'Product does not have a Stripe price ID' },
        { status: 400 }
      )
    }

    // Initialize Stripe
    // Use dynamic import for ESM compatibility
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(
      settings.stripe.testMode ? settings.stripe.apiKey : settings.stripe.liveApiKey
    )

    // Create checkout session parameters
    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        productId,
        type: 'product',
      },
    }

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    // Handle discount code if provided
    if (discountCode) {
      // Find the discount code in the database
      const discountCodeResult = await payload.find({
        collection: 'discount-codes',
        where: {
          code: {
            equals: discountCode,
          },
          isActive: {
            equals: true,
          },
        },
        limit: 1,
      })

      if (discountCodeResult.docs.length > 0) {
        const discountCodeDoc = discountCodeResult.docs[0]

        // Check if the discount code is valid for products
        const isValidForProducts = discountCodeDoc.validForProductPurchases === true

        // Check if the discount code is within its valid date range
        const now = new Date()
        const isWithinDateRange =
          (!discountCodeDoc.validFrom || new Date(discountCodeDoc.validFrom) <= now) &&
          (!discountCodeDoc.validUntil || new Date(discountCodeDoc.validUntil) >= now)

        // Check if the discount code has not exceeded its maximum uses
        const hasNotExceededMaxUses =
          !discountCodeDoc.maxUses ||
          (discountCodeDoc.usageCount || 0) < discountCodeDoc.maxUses

        // Apply the discount if valid
        if (
          isValidForProducts &&
          isWithinDateRange &&
          hasNotExceededMaxUses &&
          discountCodeDoc.stripeCouponId
        ) {
          sessionParams.discounts = [
            {
              coupon: discountCodeDoc.stripeCouponId,
            },
          ]

          // Add discount code to metadata
          sessionParams.metadata.discountCode = discountCode
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams)

    // Return the session ID and publishable key
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      publishableKey: settings.stripe.publishableKey,
    })
  } catch (error) {
    logger.error(
      { error, context: 'create-product-checkout' },
      'Error creating product checkout session',
    )

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
