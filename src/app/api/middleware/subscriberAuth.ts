/**
 * Middleware to handle subscriber authentication
 */
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * Middleware to authenticate subscribers using a token
 * This middleware should be used in API routes that need to verify subscriber access
 */
export async function subscriberAuthMiddleware(
  req: NextRequest,
  handler: (req: NextRequest, subscriber: any) => Promise<NextResponse>
) {
  try {
    // Get the subscriber token from the request
    const subscriberToken = req.headers.get('x-subscriber-token')
    
    if (!subscriberToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing subscriber token' },
        { status: 401 }
      )
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Find the subscriber by token
    const subscribers = await payload.find({
      collection: 'subscribers',
      where: {
        subscriberToken: {
          equals: subscriberToken,
        },
      },
      limit: 1,
    })

    if (subscribers.docs.length === 0) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid subscriber token' },
        { status: 401 }
      )
    }

    const subscriber = subscribers.docs[0]

    // Call the handler with the authenticated subscriber
    return handler(req, subscriber)
  } catch (error) {
    logger.error(
      { error, context: 'subscriberAuthMiddleware' },
      'Error authenticating subscriber'
    )
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
