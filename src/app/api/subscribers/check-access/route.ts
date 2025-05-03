import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { hasContentAccess, hasEventAccess } from '@/utils/subscribers'

/**
 * POST /api/subscribers/check-access
 * 
 * Check if a subscriber has access to content or an event
 * 
 * Request body:
 * {
 *   subscriberId: string,
 *   contentId?: string,
 *   eventId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { subscriberId, contentId, eventId } = body

    // Validate required fields
    if (!subscriberId) {
      return NextResponse.json(
        { error: 'Missing required field: subscriberId' },
        { status: 400 }
      )
    }

    if (!contentId && !eventId) {
      return NextResponse.json(
        { error: 'Missing required field: either contentId or eventId must be provided' },
        { status: 400 }
      )
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Check access based on the provided ID
    let hasAccess = false
    
    if (contentId) {
      hasAccess = await hasContentAccess(payload, subscriberId, contentId)
    } else if (eventId) {
      hasAccess = await hasEventAccess(payload, subscriberId, eventId)
    }

    // Return the result
    return NextResponse.json({
      hasAccess,
    })
  } catch (error) {
    logger.error(
      { error, context: 'check-access' },
      'Error checking subscriber access'
    )
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
