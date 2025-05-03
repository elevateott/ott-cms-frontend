import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'
import { withAuth } from '@/middleware/apiMiddleware'
import { findSubscriberByEmail } from '@/utils/subscribers'

/**
 * POST /api/payments/stripe/customer-portal
 *
 * Create a Stripe Customer Portal session for the authenticated user
 *
 * Request body:
 * {
 *   returnUrl?: string // Optional URL to redirect to after the session
 * }
 */
export async function POST(request: Request) {
  return withAuth(request, async (req, user, payload) => {
    try {
      // Get the request body
      const body = await req.json()
      const { returnUrl } = body || {}

      // Get the user's email
      const userEmail = user.email

      if (!userEmail) {
        return NextResponse.json({ error: 'User email not found' }, { status: 400 })
      }

      // Find the subscriber by email
      const subscriber = await findSubscriberByEmail(payload, userEmail)

      if (!subscriber) {
        return NextResponse.json({ error: 'No subscription found for this user' }, { status: 404 })
      }

      // Check if the subscriber has a Stripe customer ID
      if (!subscriber.paymentProviderCustomerId || subscriber.paymentProvider !== 'stripe') {
        return NextResponse.json(
          { error: 'No Stripe customer ID found for this user' },
          { status: 404 },
        )
      }

      // Get Stripe settings
      const settings = await getPaymentSettings()
      const { stripe: stripeSettings } = settings

      // Check if Stripe is enabled
      if (!stripeSettings.enabled) {
        return NextResponse.json({ error: 'Stripe payments are not enabled' }, { status: 400 })
      }

      // Initialize Stripe
      // Use dynamic import for ESM compatibility
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(
        stripeSettings.testMode ? stripeSettings.apiKey : stripeSettings.liveApiKey,
      )

      // Determine the return URL
      const defaultReturnUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/account`
      const effectiveReturnUrl = returnUrl || defaultReturnUrl

      // Create a Stripe Customer Portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: subscriber.paymentProviderCustomerId,
        return_url: effectiveReturnUrl,
      })

      // Return the session URL
      return NextResponse.json({ url: session.url })
    } catch (error) {
      logger.error(
        { error, context: 'stripe-customer-portal' },
        'Error creating Stripe Customer Portal session',
      )

      return NextResponse.json(
        { error: 'Failed to create Stripe Customer Portal session' },
        { status: 500 },
      )
    }
  })
}
