import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import {
  updateSubscriptionStatus,
  addPPVToSubscriber,
  addEventRentalToSubscriber,
} from '@/utils/subscribers'
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
      return NextResponse.json({ error: 'Missing PayPal webhook ID' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get PayPal settings
    const settings = await getPaymentSettings()
    const { paypal: paypalSettings } = settings

    // Verify the webhook (simplified - in production, implement proper verification)
    // PayPal webhook verification is more complex and requires the PayPal SDK

    // Handle the event
    logger.info(
      { context: 'paypal-webhook', eventType: event.event_type },
      'Processing PayPal webhook event',
    )

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.COMPLETED': {
        // Handle one-time payments (PPV and rentals)
        const order = event.resource

        // Extract payer information
        const payer = order.payer
        const email = payer.email_address
        const fullName = `${payer.name.given_name} ${payer.name.surname}`.trim()
        const payerId = payer.payer_id

        // Extract metadata from custom_id
        let metadata = {}
        try {
          if (
            order.purchase_units &&
            order.purchase_units[0] &&
            order.purchase_units[0].custom_id
          ) {
            metadata = JSON.parse(order.purchase_units[0].custom_id)
            logger.info(
              { context: 'paypal-webhook', metadata },
              'Extracted metadata from PayPal order',
            )
          }
        } catch (error) {
          logger.error(
            { error, context: 'paypal-webhook' },
            'Error parsing custom_id from PayPal order',
          )
        }

        const { type, eventId, durationHours } = metadata as {
          type?: 'ppv' | 'rental' | 'subscription'
          eventId?: string
          durationHours?: number
        }

        // Find subscriber by email
        const subscriberResult = await payload.find({
          collection: 'subscribers',
          where: {
            email: {
              equals: email,
            },
          },
          limit: 1,
        })

        const baseData = {
          email,
          fullName: fullName || email,
          paymentProvider: 'paypal',
          paymentProviderCustomerId: payerId,
        }

        // Handle PPV purchase
        if (type === 'ppv' && eventId) {
          if (subscriberResult.docs.length === 0) {
            // Create a new subscriber with PPV purchase
            const newSubscriber = await payload.create({
              collection: 'subscribers',
              data: {
                ...baseData,
                purchasedPPV: [eventId],
              },
            })

            logger.info(
              {
                context: 'paypal-webhook',
                eventType: event.event_type,
                subscriberId: newSubscriber.id,
                eventId,
              },
              'Created new subscriber with PayPal PPV purchase',
            )
          } else {
            // Add PPV to existing subscriber
            const subscriber = subscriberResult.docs[0]
            await addPPVToSubscriber(payload, subscriber.id, eventId)

            logger.info(
              {
                context: 'paypal-webhook',
                eventType: event.event_type,
                subscriberId: subscriber.id,
                eventId,
              },
              'Added PayPal PPV purchase to existing subscriber',
            )
          }
        }

        // Handle rental purchase
        else if (type === 'rental' && eventId && durationHours) {
          if (subscriberResult.docs.length === 0) {
            // Create a new subscriber
            const newSubscriber = await payload.create({
              collection: 'subscribers',
              data: baseData,
            })

            // Add the rental to the new subscriber
            await addEventRentalToSubscriber(payload, newSubscriber.id, eventId, durationHours)

            logger.info(
              {
                context: 'paypal-webhook',
                eventType: event.event_type,
                subscriberId: newSubscriber.id,
                eventId,
                durationHours,
              },
              'Created new subscriber with PayPal rental purchase',
            )
          } else {
            // Add rental to existing subscriber
            const subscriber = subscriberResult.docs[0]
            await addEventRentalToSubscriber(payload, subscriber.id, eventId, durationHours)

            logger.info(
              {
                context: 'paypal-webhook',
                eventType: event.event_type,
                subscriberId: subscriber.id,
                eventId,
                durationHours,
              },
              'Added PayPal rental purchase to existing subscriber',
            )
          }
        }

        break
      }

      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // Handle subscription activation
        const subscription = event.resource
        const payer = subscription.subscriber.payer
        const email = payer.email_address
        const fullName = payer.name?.given_name || email
        const payerId = payer.payer_id

        // Extract metadata from custom_id if available
        let metadata = {}
        try {
          if (subscription.custom_id) {
            metadata = JSON.parse(subscription.custom_id)
            logger.info(
              { context: 'paypal-webhook', metadata },
              'Extracted metadata from PayPal subscription',
            )
          }
        } catch (error) {
          logger.error(
            { error, context: 'paypal-webhook' },
            'Error parsing custom_id from PayPal subscription',
          )
        }

        const { planId } = metadata as { planId?: string }

        // If no planId in metadata, try to find the plan by PayPal plan ID
        let resolvedPlanId = planId
        if (!resolvedPlanId && subscription.plan_id) {
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
            resolvedPlanId = planResult.docs[0].id
          }
        }

        if (!resolvedPlanId) {
          logger.error(
            { context: 'paypal-webhook', subscriptionId: subscription.id },
            'Could not resolve plan ID for PayPal subscription',
          )
          break
        }

        // Find subscriber by email
        const subscriberResult = await payload.find({
          collection: 'subscribers',
          where: {
            email: {
              equals: email,
            },
          },
          limit: 1,
        })

        // Calculate expiration date
        const expiresAt = new Date(subscription.billing_info.next_billing_time)

        if (subscriberResult.docs.length === 0) {
          // Create a new subscriber with subscription
          const newSubscriber = await payload.create({
            collection: 'subscribers',
            data: {
              email,
              fullName,
              paymentProvider: 'paypal',
              paymentProviderCustomerId: payerId,
              subscriptionStatus: 'active',
              subscriptionExpiresAt: expiresAt.toISOString(),
              activePlans: [resolvedPlanId],
            },
          })

          logger.info(
            {
              context: 'paypal-webhook',
              eventType: event.event_type,
              subscriberId: newSubscriber.id,
              planId: resolvedPlanId,
            },
            'Created new subscriber with PayPal subscription',
          )
        } else {
          // Update existing subscriber
          const subscriber = subscriberResult.docs[0]

          // Get current active plans
          const activePlans = [...(subscriber.activePlans || [])]
          if (!activePlans.includes(resolvedPlanId)) {
            activePlans.push(resolvedPlanId)
          }

          // Update the subscriber
          await payload.update({
            collection: 'subscribers',
            id: subscriber.id,
            data: {
              paymentProvider: 'paypal',
              paymentProviderCustomerId: payerId,
              subscriptionStatus: 'active',
              subscriptionExpiresAt: expiresAt.toISOString(),
              activePlans,
            },
          })

          logger.info(
            {
              context: 'paypal-webhook',
              eventType: event.event_type,
              subscriberId: subscriber.id,
              planId: resolvedPlanId,
            },
            'Updated subscriber with PayPal subscription',
          )
        }

        break
      }

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
        await updateSubscriptionStatus(payload, payerId, mappedStatus, expiresAt, planIds)

        break
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscription = event.resource
        const payerId = subscription.subscriber.payer_id

        // Update the subscriber's subscription status to canceled
        await updateSubscriptionStatus(payload, payerId, 'canceled')

        break
      }

      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        const subscription = event.resource
        const payerId = subscription.subscriber.payer_id

        // Update the subscriber's subscription status to past_due
        await updateSubscriptionStatus(payload, payerId, 'past_due')

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error({ error, context: 'paypal-webhook' }, 'Error handling PayPal webhook')
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
