import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

/**
 * POST /api/payments/stripe/create-checkout
 *
 * Create a Stripe checkout session for a subscription plan
 *
 * Request body:
 * {
 *   planId: string,
 *   successUrl: string,
 *   cancelUrl: string,
 *   customerEmail?: string,
 *   discountCode?: string,
 * }
 */
export async function POST(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    // Get request body
    const body = await req.json()
    const { planId, successUrl, cancelUrl, customerEmail, discountCode } = body

    // Validate required fields
    if (!planId) {
      return NextResponse.json({ error: 'Missing required field: planId' }, { status: 400 })
    }

    if (!successUrl) {
      return NextResponse.json({ error: 'Missing required field: successUrl' }, { status: 400 })
    }

    if (!cancelUrl) {
      return NextResponse.json({ error: 'Missing required field: cancelUrl' }, { status: 400 })
    }

    // Get payment settings
    const settings = await getPaymentSettings()

    // Check if Stripe is enabled
    if (!settings.stripe.enabled) {
      return NextResponse.json({ error: 'Stripe payments are not enabled' }, { status: 400 })
    }

    // Check if Stripe is connected
    if (!settings.stripe.connected) {
      return NextResponse.json(
        { error: 'Stripe is not connected. Please verify your credentials in the admin panel.' },
        { status: 400 },
      )
    }

    // Get the subscription plan
    const plan = await payload.findByID({
      collection: 'subscription-plans',
      id: planId,
    })

    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 })
    }

    // Check if plan is active
    if (!plan.isActive) {
      return NextResponse.json({ error: 'Subscription plan is not active' }, { status: 400 })
    }

    // Check if plan has Stripe IDs
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Subscription plan does not have Stripe price ID' },
        { status: 400 },
      )
    }

    // Initialize Stripe
    // Use dynamic import for ESM compatibility
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(
      settings.stripe.testMode ? settings.stripe.apiKey : settings.stripe.liveApiKey,
    )

    // Create checkout session parameters
    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planId,
      },
    }

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    // Handle setup fee if present
    if (plan.setupFeeAmount > 0 && plan.stripeSetupFeeId) {
      // Add setup fee as a one-time payment
      sessionParams.line_items.push({
        price: plan.stripeSetupFeeId,
        quantity: 1,
      })
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

        // Check if the discount code is valid for subscriptions
        const isValidForSubscriptions =
          !discountCodeDoc.limitTo ||
          discountCodeDoc.limitTo.length === 0 ||
          discountCodeDoc.limitTo.includes('subscriptions')

        // Check if the discount code is within valid date range
        const now = new Date()
        const isWithinDateRange =
          (!discountCodeDoc.validFrom || new Date(discountCodeDoc.validFrom) <= now) &&
          (!discountCodeDoc.validUntil || new Date(discountCodeDoc.validUntil) >= now)

        // Check if the discount code has not exceeded max uses
        const hasNotExceededMaxUses =
          !discountCodeDoc.maxUses ||
          discountCodeDoc.maxUses === 0 ||
          discountCodeDoc.usageCount < discountCodeDoc.maxUses

        // Apply the discount if valid
        if (
          isValidForSubscriptions &&
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
      { error, context: 'stripe-create-checkout' },
      'Error creating Stripe checkout session',
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
