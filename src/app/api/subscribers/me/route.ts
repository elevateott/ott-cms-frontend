import { NextRequest, NextResponse } from 'next/server'
import { subscriberAuthMiddleware } from '@/app/api/middleware/subscriberAuth'
import { logger } from '@/utils/logger'

/**
 * GET /api/subscribers/me
 * 
 * Get the current subscriber's information
 * Requires x-subscriber-token header
 */
export async function GET(request: NextRequest) {
  return subscriberAuthMiddleware(request, async (req, subscriber) => {
    try {
      // Return the subscriber data (excluding sensitive fields)
      const {
        id,
        fullName,
        email,
        subscriptionStatus,
        subscriptionExpiresAt,
        activePlans,
        purchasedRentals,
        purchasedPPV,
      } = subscriber

      return NextResponse.json({
        id,
        fullName,
        email,
        subscriptionStatus,
        subscriptionExpiresAt,
        activePlans,
        purchasedRentals,
        purchasedPPV,
      })
    } catch (error) {
      logger.error(
        { error, context: 'subscribers/me' },
        'Error getting subscriber information'
      )
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
