import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { updateSubscriptionStatus } from '@/utils/subscribers'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

/**
 * POST /api/webhooks/stripe
 * 
 * Handle Stripe webhook events
 */
export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get Stripe settings
    const settings = await getPaymentSettings()
    const { stripe: stripeSettings } = settings

    // Initialize Stripe
    const stripe = require('stripe')(stripeSettings.testMode ? stripeSettings.apiKey : stripeSettings.liveApiKey)

    // Verify the webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeSettings.testMode 
          ? process.env.STRIPE_TEST_WEBHOOK_SECRET 
          : process.env.STRIPE_LIVE_WEBHOOK_SECRET
      )
    } catch (err) {
      logger.error({ error: err, context: 'stripe-webhook' }, 'Error verifying Stripe webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    logger.info({ context: 'stripe-webhook', eventType: event.type }, 'Processing Stripe webhook event')

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer
        const status = subscription.status
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
        
        // Get the plan IDs
        const planIds = []
        if (subscription.items && subscription.items.data) {
          for (const item of subscription.items.data) {
            // Find the subscription plan by Stripe price ID
            const planResult = await payload.find({
              collection: 'subscription-plans',
              where: {
                stripePriceId: {
                  equals: item.price.id,
                },
              },
              limit: 1,
            })
            
            if (planResult.docs.length > 0) {
              planIds.push(planResult.docs[0].id)
            }
          }
        }
        
        // Update the subscriber's subscription status
        await updateSubscriptionStatus(
          payload,
          customerId,
          status as any,
          currentPeriodEnd,
          planIds
        )
        
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer
        
        // Update the subscriber's subscription status to canceled
        await updateSubscriptionStatus(
          payload,
          customerId,
          'canceled'
        )
        
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer
        
        // Update the subscriber's subscription status to past_due
        await updateSubscriptionStatus(
          payload,
          customerId,
          'past_due'
        )
        
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error({ error, context: 'stripe-webhook' }, 'Error handling Stripe webhook')
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
