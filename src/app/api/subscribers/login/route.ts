import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { generateSubscriberToken } from '@/utils/subscribers'
import {
  generateDeviceId,
  trackSubscriberSession,
  hasReachedDeviceLimit,
} from '@/utils/sessionTracking'
import { getOTTSettings } from '@/utils/getOTTSettings'

/**
 * POST /api/subscribers/login
 *
 * Login a subscriber by email
 *
 * Request body:
 * {
 *   email: string
 *   deviceId?: string (optional - will be generated if not provided)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { email, deviceId: providedDeviceId } = body

    // Get IP and user agent
    const ip = request.headers.get('x-forwarded-for') || request.ip || null
    const userAgent = request.headers.get('user-agent') || null

    // Generate or use provided device ID
    const deviceId = providedDeviceId || generateDeviceId(userAgent)

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: 'Missing required field: email' }, { status: 400 })
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
      return NextResponse.json({ error: 'No subscriber found with this email' }, { status: 404 })
    }

    const subscriber = subscribers.docs[0]

    // Get OTT settings to check if device limiting is enabled
    const ottSettings = await getOTTSettings()
    const deviceLimitingEnabled = ottSettings?.features?.enableDeviceLimiting || false

    // Check if the subscriber has reached their device limit
    if (deviceLimitingEnabled) {
      const reachedLimit = await hasReachedDeviceLimit(payload, subscriber.id)
      const hasExistingSession = subscriber.activeSessions?.some(
        (s: any) => s.deviceId === deviceId,
      )

      // If they've reached the limit and this is a new device, return an error
      if (reachedLimit && !hasExistingSession) {
        return NextResponse.json(
          {
            error: 'Device limit reached',
            message:
              'You have reached the maximum number of devices allowed for your account. Please log out from another device and try again.',
            deviceLimitReached: true,
          },
          { status: 403 },
        )
      }
    }

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

    // Track the session
    await trackSubscriberSession({
      email: subscriber.email,
      deviceId,
      ip,
      userAgent,
    })

    // Return the subscriber token
    return NextResponse.json({
      id: subscriber.id,
      email: subscriber.email,
      fullName: subscriber.fullName,
      token: subscriber.subscriberToken,
      deviceId, // Return the device ID so the client can store it
    })
  } catch (error) {
    logger.error({ error, context: 'subscribers/login' }, 'Error logging in subscriber')

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
