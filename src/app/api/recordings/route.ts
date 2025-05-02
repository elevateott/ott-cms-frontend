import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'

/**
 * GET /api/recordings
 * 
 * Fetch recordings, optionally filtered by live event
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const liveEventId = searchParams.get('liveEvent')
    
    logger.info(
      { context: 'recordings/route' },
      `Fetching recordings${liveEventId ? ` for live event ${liveEventId}` : ''}`
    )
    
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Build query
    const query: any = {
      limit: 100,
    }
    
    // Add filter for live event if provided
    if (liveEventId) {
      query.where = {
        liveEvent: {
          equals: liveEventId,
        },
      }
    }
    
    // Fetch recordings
    const recordings = await payload.find({
      collection: 'recordings',
      ...query,
    })
    
    return createApiResponse(recordings)
  } catch (error) {
    logger.error(
      { context: 'recordings/route', error },
      'Failed to fetch recordings'
    )
    
    return createErrorResponse('Failed to fetch recordings', 500)
  }
}
