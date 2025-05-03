import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { subscriberAuthMiddleware } from '@/app/api/middleware/subscriberAuth'
import { removeSubscriberSession } from '@/utils/sessionTracking'

/**
 * GET /api/subscribers/sessions
 * 
 * Get all active sessions for the authenticated subscriber
 */
export async function GET(request: NextRequest) {
  return subscriberAuthMiddleware(request, async (req, subscriber) => {
    try {
      // Return the active sessions
      return NextResponse.json({
        sessions: subscriber.activeSessions || [],
      })
    } catch (error) {
      logger.error(
        { error, context: 'subscribers/sessions' },
        'Error getting subscriber sessions'
      )
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

/**
 * DELETE /api/subscribers/sessions
 * 
 * Delete a specific session or all sessions for the authenticated subscriber
 * 
 * Query parameters:
 * - deviceId: string (optional) - The device ID to remove. If not provided, all sessions will be removed.
 */
export async function DELETE(request: NextRequest) {
  return subscriberAuthMiddleware(request, async (req, subscriber) => {
    try {
      const { searchParams } = new URL(req.url)
      const deviceId = searchParams.get('deviceId')
      
      // Initialize Payload
      const payload = await getPayload({ config: configPromise })
      
      if (deviceId) {
        // Remove a specific session
        await removeSubscriberSession(payload, subscriber.id, deviceId)
        
        return NextResponse.json({
          success: true,
          message: 'Session removed successfully',
        })
      } else {
        // Remove all sessions
        await payload.update({
          collection: 'subscribers',
          id: subscriber.id,
          data: {
            activeSessions: [],
          },
        })
        
        return NextResponse.json({
          success: true,
          message: 'All sessions removed successfully',
        })
      }
    } catch (error) {
      logger.error(
        { error, context: 'subscribers/sessions' },
        'Error removing subscriber sessions'
      )
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
