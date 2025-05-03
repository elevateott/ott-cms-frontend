import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { updateSubscriptionStatus } from '@/utils/subscribers'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

/**
 * POST /api/webhooks/paypal
 * 
 * Handle PayPal webhook events
 */
export async function POST(request: Request) {
  try {
    // Get the request body
    const event = await request.json()
    const webhookId = request.headers.get('paypal-auth-algo')

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Missing PayPal webhook ID' },
        { status: 400 }
      )
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get PayPal settings
    const settings = await getPaymentSettings()
    const { paypal: paypalSettings } = settings

    // Verify the webhook (simplified - in production, implement proper verification)
    // PayPal webhook verification is more complex and requires the PayPal SDK
    
    // Handle the event
    logger.info({ context: 'paypal-webhook', eventType: event.event_type }, 'Processing PayPal webhook event')

    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const subscription = event.resource
        const payerId = subscription.subscriber.payer_id
        const status = subscription.status.toLowerCase()
        
        // Map PayPal status to our status
        let mappedStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' = 'none'
        
        if (status === 'active') {
          mappedStatus = 'active'
        } else if (status === 'suspended') {
          mappedStatus = 'past_due'
        } else if (status === 'cancelled') {
          mappedStatus = 'canceled'
        }
        
        // Calculate expiration date
        const expiresAt = new Date(subscription.billing_info.next_billing_time)
        
        // Get the plan IDs
        const planIds = []
        if (subscription.plan_id) {
          // Find the subscription plan by PayPal plan ID
          const planResult = await payload.find({
            collection: 'subscription-plans',
            where: {
              paypalPlanId: {
                equals: subscription.plan_id,
              },
            },
            limit: 1,
          })
          
          if (planResult.docs.length > 0) {
            planIds.push(planResult.docs[0].id)
          }
        }
        
        // Update the subscriber's subscription status
        await updateSubscriptionStatus(
          payload,
          payerId,
          mappedStatus,
          expiresAt,
          planIds
        )
        
        break
      }
      
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscription = event.resource
        const payerId = subscription.subscriber.payer_id
        
        // Update the subscriber's subscription status to canceled
        await updateSubscriptionStatus(
          payload,
          payerId,
          'canceled'
        )
        
        break
      }
      
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subscription = event.resource
        const payerId = subscription.subscriber.payer_id
        
        // Update the subscriber's subscription status to past_due
        await updateSubscriptionStatus(
          payload,
          payerId,
          'past_due'
        )
        
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error({ error, context: 'paypal-webhook' }, 'Error handling PayPal webhook')
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
