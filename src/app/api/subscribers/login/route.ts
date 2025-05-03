import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { generateSubscriberToken } from '@/utils/subscribers'

/**
 * POST /api/subscribers/login
 * 
 * Login a subscriber by email
 * 
 * Request body:
 * {
 *   email: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { email } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Missing required field: email' },
        { status: 400 }
      )
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Find the subscriber by email
    const subscribers = await payload.find({
      collection: 'subscribers',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
    })

    if (subscribers.docs.length === 0) {
      return NextResponse.json(
        { error: 'No subscriber found with this email' },
        { status: 404 }
      )
    }

    const subscriber = subscribers.docs[0]

    // Generate a new token if one doesn't exist
    if (!subscriber.subscriberToken) {
      const subscriberToken = generateSubscriberToken()
      
      await payload.update({
        collection: 'subscribers',
        id: subscriber.id,
        data: {
          subscriberToken,
        },
      })
      
      subscriber.subscriberToken = subscriberToken
    }

    // Return the subscriber token
    return NextResponse.json({
      id: subscriber.id,
      email: subscriber.email,
      fullName: subscriber.fullName,
      token: subscriber.subscriberToken,
    })
  } catch (error) {
    logger.error(
      { error, context: 'subscribers/login' },
      'Error logging in subscriber'
    )
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
