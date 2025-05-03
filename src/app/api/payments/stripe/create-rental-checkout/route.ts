import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@/utilities/getPayloadHMR'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

/**
 * POST /api/payments/stripe/create-rental-checkout
 *
 * Create a Stripe checkout session for a rental live event
 *
 * Request body:
 * {
 *   eventId: string,
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
    const { eventId, successUrl, cancelUrl, customerEmail, discountCode } = body

    // Validate required fields
    if (!eventId) {
      return NextResponse.json({ error: 'Missing required field: eventId' }, { status: 400 })
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

    // Get the live event
    const event = await payload.findByID({
      collection: 'live-events',
      id: eventId,
    })

    if (!event) {
      return NextResponse.json({ error: 'Live event not found' }, { status: 404 })
    }

    // Check if event has rental enabled
    if (!event.rentalEnabled) {
      return NextResponse.json({ error: 'Rental is not enabled for this event' }, { status: 400 })
    }

    // Check if event has Stripe price ID
    if (!event.rentalStripePriceId) {
      return NextResponse.json(
        { error: 'Live event does not have a rental Stripe price ID' },
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
          price: event.rentalStripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        eventId,
        type: 'rental',
        durationHours: event.rentalDurationHours.toString(),
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

        // Check if the discount code is valid for rentals
        const isValidForRentals =
          !discountCodeDoc.limitTo ||
          discountCodeDoc.limitTo.length === 0 ||
          discountCodeDoc.limitTo.includes('rentals')

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
          isValidForRentals &&
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
      { error, context: 'create-rental-checkout' },
      'Error creating rental checkout session',
    )
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
