import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * GET /api/live-events
 *
 * Fetches live events with optional filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get query parameters
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const sort = url.searchParams.get('sort') || '-createdAt'
    const status = url.searchParams.get('status')

    // Build query
    const query: any = {}
    if (status) {
      query.status = { equals: status }
    }

    // Fetch live events
    const result = await payload.find({
      collection: 'live-events',
      where: Object.keys(query).length > 0 ? query : undefined,
      limit,
      page,
      sort: sort as string,
      depth: 0,
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error({ context: 'live-events/route' }, 'Error fetching live events:', error)
    return NextResponse.json({ error: 'Failed to fetch live events' }, { status: 500 })
  }
}
