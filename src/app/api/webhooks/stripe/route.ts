import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import {
  updateSubscriptionStatus,
  addPPVToSubscriber,
  addEventRentalToSubscriber,
} from '@/utils/subscribers'
import { recordTransaction } from '@/utils/transactions'
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
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get Stripe settings
    const settings = await getPaymentSettings()
    const { stripe: stripeSettings } = settings

    // Initialize Stripe
    // Use dynamic import for ESM compatibility
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(
      stripeSettings.testMode ? stripeSettings.apiKey : stripeSettings.liveApiKey,
    )

    // Verify the webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeSettings.testMode
          ? process.env.STRIPE_TEST_WEBHOOK_SECRET
          : process.env.STRIPE_LIVE_WEBHOOK_SECRET,
      )
    } catch (err) {
      logger.error(
        { error: err, context: 'stripe-webhook' },
        'Error verifying Stripe webhook signature',
      )
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    logger.info(
      { context: 'stripe-webhook', eventType: event.type },
      'Processing Stripe webhook event',
    )

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
          planIds,
        )

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        // Update the subscriber's subscription status to canceled
        await updateSubscriptionStatus(payload, customerId, 'canceled')

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer

        // Update the subscriber's subscription status to past_due
        await updateSubscriptionStatus(payload, customerId, 'past_due')

        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object

        // Track discount code usage if one was used
        if (session.metadata?.discountCode) {
          const discountCode = session.metadata.discountCode

          // Find the discount code in the database
          const discountCodeResult = await payload.find({
            collection: 'discount-codes',
            where: {
              code: {
                equals: discountCode,
              },
            },
            limit: 1,
          })

          if (discountCodeResult.docs.length > 0) {
            const discountCodeDoc = discountCodeResult.docs[0]

            // Increment the usage count
            await payload.update({
              collection: 'discount-codes',
              id: discountCodeDoc.id,
              data: {
                usageCount: (discountCodeDoc.usageCount || 0) + 1,
              },
            })

            logger.info(
              {
                context: 'stripe-webhook',
                eventType: event.type,
                discountCode,
              },
              'Incremented discount code usage count',
            )
          }
        }

        // Check if this is a PPV purchase
        if (
          session.mode === 'payment' &&
          session.metadata?.type === 'ppv' &&
          session.metadata?.eventId
        ) {
          const eventId = session.metadata.eventId
          const customerEmail = session.customer_details?.email

          if (!customerEmail) {
            logger.error(
              { context: 'stripe-webhook', eventType: event.type },
              'Missing customer email for PPV purchase',
            )
            break
          }

          // Find the subscriber by email
          const subscriberResult = await payload.find({
            collection: 'subscribers',
            where: {
              email: {
                equals: customerEmail,
              },
            },
            limit: 1,
          })

          if (subscriberResult.docs.length === 0) {
            // Create a new subscriber
            const newSubscriber = await payload.create({
              collection: 'subscribers',
              data: {
                email: customerEmail,
                fullName: session.customer_details?.name || customerEmail,
                paymentProvider: 'stripe',
                paymentProviderCustomerId: session.customer,
                purchasedPPV: [eventId],
              },
            })

            // Record the transaction
            const amount = session.amount_total || 0
            await recordTransaction(payload, {
              email: customerEmail,
              type: 'ppv',
              amount,
              paymentProvider: 'stripe',
              subscriber: newSubscriber.id,
              subscriberId: newSubscriber.id,
              event: eventId,
              transactionId: session.id,
              paymentMethod: session.payment_method_types?.[0] || 'card',
              metadata: {
                sessionId: session.id,
                customerId: session.customer,
              },
            })

            logger.info(
              {
                context: 'stripe-webhook',
                eventType: event.type,
                subscriberId: newSubscriber.id,
                eventId,
              },
              'Created new subscriber with PPV purchase',
            )
          } else {
            // Add the PPV event to the existing subscriber
            const subscriber = subscriberResult.docs[0]
            await addPPVToSubscriber(payload, subscriber.id, eventId)

            // Record the transaction
            const amount = session.amount_total || 0
            await recordTransaction(payload, {
              email: customerEmail,
              type: 'ppv',
              amount,
              paymentProvider: 'stripe',
              subscriber: subscriber.id,
              subscriberId: subscriber.id,
              event: eventId,
              transactionId: session.id,
              paymentMethod: session.payment_method_types?.[0] || 'card',
              metadata: {
                sessionId: session.id,
                customerId: session.customer,
              },
            })

            logger.info(
              {
                context: 'stripe-webhook',
                eventType: event.type,
                subscriberId: subscriber.id,
                eventId,
              },
              'Added PPV purchase to existing subscriber',
            )
          }
        }

        // Check if this is a rental purchase
        if (
          session.mode === 'payment' &&
          session.metadata?.type === 'rental' &&
          session.metadata?.eventId &&
          session.metadata?.durationHours
        ) {
          const eventId = session.metadata.eventId
          const durationHours = parseInt(session.metadata.durationHours, 10)
          const customerEmail = session.customer_details?.email

          if (!customerEmail) {
            logger.error(
              { context: 'stripe-webhook', eventType: event.type },
              'Missing customer email for rental purchase',
            )
            break
          }

          // Find the subscriber by email
          const subscriberResult = await payload.find({
            collection: 'subscribers',
            where: {
              email: {
                equals: customerEmail,
              },
            },
            limit: 1,
          })

          if (subscriberResult.docs.length === 0) {
            // Create a new subscriber
            const newSubscriber = await payload.create({
              collection: 'subscribers',
              data: {
                email: customerEmail,
                fullName: session.customer_details?.name || customerEmail,
                paymentProvider: 'stripe',
                paymentProviderCustomerId: session.customer,
              },
            })

            // Add the rental to the new subscriber
            await addEventRentalToSubscriber(payload, newSubscriber.id, eventId, durationHours)

            // Record the transaction
            const amount = session.amount_total || 0
            const expiresAt = new Date()
            expiresAt.setHours(expiresAt.getHours() + durationHours)

            await recordTransaction(payload, {
              email: customerEmail,
              type: 'rental',
              amount,
              paymentProvider: 'stripe',
              subscriber: newSubscriber.id,
              subscriberId: newSubscriber.id,
              event: eventId,
              transactionId: session.id,
              paymentMethod: session.payment_method_types?.[0] || 'card',
              rentalDuration: durationHours,
              expiresAt: expiresAt.toISOString(),
              metadata: {
                sessionId: session.id,
                customerId: session.customer,
              },
            })

            logger.info(
              {
                context: 'stripe-webhook',
                eventType: event.type,
                subscriberId: newSubscriber.id,
                eventId,
                durationHours,
              },
              'Created new subscriber with rental purchase',
            )
          } else {
            // Add the rental to the existing subscriber
            const subscriber = subscriberResult.docs[0]
            await addEventRentalToSubscriber(payload, subscriber.id, eventId, durationHours)

            // Record the transaction
            const amount = session.amount_total || 0
            const expiresAt = new Date()
            expiresAt.setHours(expiresAt.getHours() + durationHours)

            await recordTransaction(payload, {
              email: customerEmail,
              type: 'rental',
              amount,
              paymentProvider: 'stripe',
              subscriber: subscriber.id,
              subscriberId: subscriber.id,
              event: eventId,
              transactionId: session.id,
              paymentMethod: session.payment_method_types?.[0] || 'card',
              rentalDuration: durationHours,
              expiresAt: expiresAt.toISOString(),
              metadata: {
                sessionId: session.id,
                customerId: session.customer,
              },
            })

            logger.info(
              {
                context: 'stripe-webhook',
                eventType: event.type,
                subscriberId: subscriber.id,
                eventId,
                durationHours,
              },
              'Added rental purchase to existing subscriber',
            )
          }
        }

        // Check if this is a subscription purchase
        if (
          session.mode === 'subscription' &&
          session.metadata?.type === 'subscription' &&
          session.metadata?.planId
        ) {
          const planId = session.metadata.planId
          const customerEmail = session.customer_details?.email
          const customerId = session.customer

          if (!customerEmail) {
            logger.error(
              { context: 'stripe-webhook', eventType: event.type },
              'Missing customer email for subscription purchase',
            )
            break
          }

          // Find the subscriber by email
          const subscriberResult = await payload.find({
            collection: 'subscribers',
            where: {
              email: {
                equals: customerEmail,
              },
            },
            limit: 1,
          })

          // Calculate subscription expiration date (default to 1 month from now)
          // This will be updated by the customer.subscription.created event later
          const expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 1)

          if (subscriberResult.docs.length === 0) {
            // Create a new subscriber
            const newSubscriber = await payload.create({
              collection: 'subscribers',
              data: {
                email: customerEmail,
                fullName: session.customer_details?.name || customerEmail,
                paymentProvider: 'stripe',
                paymentProviderCustomerId: customerId,
                subscriptionStatus: 'active',
                subscriptionExpiresAt: expiresAt.toISOString(),
                activePlans: [planId],
              },
            })

            // Find the plan to get the price
            const planResult = await payload.find({
              collection: 'subscription-plans',
              where: {
                id: {
                  equals: planId,
                },
              },
              limit: 1,
            })

            // Record the transaction
            const amount = session.amount_total || 0
            await recordTransaction(payload, {
              email: customerEmail,
              type: 'subscription',
              amount,
              paymentProvider: 'stripe',
              subscriber: newSubscriber.id,
              subscriberId: newSubscriber.id,
              plan: planId,
              transactionId: session.id,
              paymentMethod: session.payment_method_types?.[0] || 'card',
              metadata: {
                sessionId: session.id,
                customerId: session.customer,
                subscriptionId: session.subscription,
              },
            })

            logger.info(
              {
                context: 'stripe-webhook',
                eventType: event.type,
                subscriberId: newSubscriber.id,
                planId,
              },
              'Created new subscriber with subscription purchase',
            )
          } else {
            // Update the existing subscriber
            const subscriber = subscriberResult.docs[0]

            // Get current active plans
            const activePlans = [...(subscriber.activePlans || [])]
            if (!activePlans.includes(planId)) {
              activePlans.push(planId)
            }

            // Update the subscriber
            await payload.update({
              collection: 'subscribers',
              id: subscriber.id,
              data: {
                paymentProvider: 'stripe',
                paymentProviderCustomerId: customerId,
                subscriptionStatus: 'active',
                subscriptionExpiresAt: expiresAt.toISOString(),
                activePlans,
              },
            })

            // Record the transaction
            const amount = session.amount_total || 0
            await recordTransaction(payload, {
              email: customerEmail,
              type: 'subscription',
              amount,
              paymentProvider: 'stripe',
              subscriber: subscriber.id,
              subscriberId: subscriber.id,
              plan: planId,
              transactionId: session.id,
              paymentMethod: session.payment_method_types?.[0] || 'card',
              metadata: {
                sessionId: session.id,
                customerId: session.customer,
                subscriptionId: session.subscription,
              },
            })

            logger.info(
              {
                context: 'stripe-webhook',
                eventType: event.type,
                subscriberId: subscriber.id,
                planId,
              },
              'Updated subscriber with subscription purchase',
            )
          }
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error({ error, context: 'stripe-webhook' }, 'Error handling Stripe webhook')
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
