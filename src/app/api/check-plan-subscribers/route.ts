import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/payload'
import { hasPlanSubscribers } from '@/services/subscription/hasPlanSubscribers'
import { logger } from '@/utils/logger'
import { configPromise } from '@/payload.config'

/**
 * API endpoint to check if a subscription plan has subscribers
 * Used by the admin UI to determine which fields can be edited
 */
export async function GET(req: NextRequest) {
  try {
    // Get planId from query params
    const url = new URL(req.url)
    const planId = url.searchParams.get('planId')

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing planId parameter' },
        { status: 400 }
      )
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Check if plan has subscribers
    const hasSubscribers = await hasPlanSubscribers(payload, planId)

    // Return the result
    return NextResponse.json({
      hasSubscribers,
    })
  } catch (error) {
    logger.error(
      { error, context: 'check-plan-subscribers' },
      'Error checking if plan has subscribers'
    )
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
