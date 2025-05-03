import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

/**
 * POST /api/payments/stripe/create-ppv-checkout
 *
 * Create a Stripe checkout session for a PPV live event
 *
 * Request body:
 * {
 *   eventId: string,
 *   successUrl: string,
 *   cancelUrl: string,
 *   customerEmail?: string,
 * }
 */
export async function POST(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    // Get request body
    const body = await req.json()
    const { eventId, successUrl, cancelUrl, customerEmail } = body

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

    // Check if event has PPV enabled
    if (!event.ppvEnabled) {
      return NextResponse.json({ error: 'Pay-per-view is not enabled for this event' }, { status: 400 })
    }

    // Check if event has Stripe price ID
    if (!event.ppvStripePriceId) {
      return NextResponse.json(
        { error: 'Live event does not have a Stripe price ID' },
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
          price: event.ppvStripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        eventId,
        type: 'ppv',
      },
    }

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail
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
      { error, context: 'stripe-create-ppv-checkout' },
      'Error creating Stripe PPV checkout session',
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
