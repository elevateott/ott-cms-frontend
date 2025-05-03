// src/app/api/live-event-registrations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { withAuth } from '@/middleware/apiMiddleware'

/**
 * GET /api/live-event-registrations
 * 
 * Fetch registrations, optionally filtered by live event
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (req, user, payload) => {
    try {
      const { searchParams } = new URL(req.url)
      const liveEventId = searchParams.get('liveEvent')
      
      logger.info(
        { context: 'live-event-registrations/route' },
        `Fetching registrations${liveEventId ? ` for live event ${liveEventId}` : ''}`
      )
      
      // Build query
      const query: any = {
        limit: 100,
        sort: '-createdAt',
      }
      
      // Add filter for live event if provided
      if (liveEventId) {
        query.where = {
          liveEvent: {
            equals: liveEventId,
          },
        }
      }
      
      // Fetch registrations
      const registrations = await payload.find({
        collection: 'live-event-registrations',
        ...query,
      })
      
      return NextResponse.json(registrations)
    } catch (error) {
      logger.error(
        { context: 'live-event-registrations/route' },
        `Error fetching registrations: ${error instanceof Error ? error.message : String(error)}`
      )
      
      return NextResponse.json(
        { error: 'Failed to fetch registrations' },
        { status: 500 }
      )
    }
  })
}
