import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import {
  updateSubscriptionStatus,
  addPPVToSubscriber,
  addEventRentalToSubscriber,
} from '@/utils/subscribers'

/**
 * POST /api/test/stripe-webhook-handler
 * 
 * Test handler for simulating Stripe webhook events
 * This is for testing purposes only and should not be used in production
 */
export async function POST(request: Request) {
  try {
    // Get the webhook event from the request body
    const webhookEvent = await request.json()
    
    // Initialize Payload
    const payload = await getPayloadHMR({ config: configPromise })
    
    // Log the event
    logger.info(
      { context: 'test-stripe-webhook-handler', eventType: webhookEvent.type },
      'Processing test webhook event'
    )
    
    // Handle the event based on its type
    if (webhookEvent.type === 'checkout.session.completed') {
      const session = webhookEvent.data.object
      
      // Check if this is a PPV purchase
      if (
        session.mode === 'payment' &&
        session.metadata?.type === 'ppv' &&
        session.metadata?.eventId
      ) {
        const eventId = session.metadata.eventId
        const customerEmail = session.customer_details?.email
        
        if (!customerEmail) {
          return NextResponse.json(
            { error: 'Missing customer email for PPV purchase' },
            { status: 400 }
          )
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
          
          return NextResponse.json({
            success: true,
            message: 'Created new subscriber with PPV purchase',
            subscriberId: newSubscriber.id,
          })
        } else {
          // Add the PPV event to the existing subscriber
          const subscriber = subscriberResult.docs[0]
          await addPPVToSubscriber(payload, subscriber.id, eventId)
          
          return NextResponse.json({
            success: true,
            message: 'Added PPV purchase to existing subscriber',
            subscriberId: subscriber.id,
          })
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
          return NextResponse.json(
            { error: 'Missing customer email for rental purchase' },
            { status: 400 }
          )
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
          
          return NextResponse.json({
            success: true,
            message: 'Created new subscriber with rental purchase',
            subscriberId: newSubscriber.id,
          })
        } else {
          // Add the rental to the existing subscriber
          const subscriber = subscriberResult.docs[0]
          await addEventRentalToSubscriber(payload, subscriber.id, eventId, durationHours)
          
          return NextResponse.json({
            success: true,
            message: 'Added rental purchase to existing subscriber',
            subscriberId: subscriber.id,
          })
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
          return NextResponse.json(
            { error: 'Missing customer email for subscription purchase' },
            { status: 400 }
          )
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
          
          return NextResponse.json({
            success: true,
            message: 'Created new subscriber with subscription purchase',
            subscriberId: newSubscriber.id,
          })
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
          
          return NextResponse.json({
            success: true,
            message: 'Updated subscriber with subscription purchase',
            subscriberId: subscriber.id,
          })
        }
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unsupported event type or missing required metadata',
    })
  } catch (error) {
    logger.error(
      { error, context: 'test-stripe-webhook-handler' },
      'Error handling test webhook event'
    )
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
