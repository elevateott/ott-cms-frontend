// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * GET /api/notifications
 * 
 * Get a list of notifications
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const page = parseInt(url.searchParams.get('page') || '1')
    const sort = url.searchParams.get('sort') || '-createdAt'
    const read = url.searchParams.get('read')
    
    // Get payload instance
    const payload = await getPayload({ config: configPromise })
    
    // Build query
    const query: any = {
      collection: 'notifications',
      limit,
      page,
      sort,
    }
    
    // Add read filter if provided
    if (read !== null) {
      query.where = {
        read: {
          equals: read === 'true',
        },
      }
    }
    
    // Execute query
    const result = await payload.find(query)
    
    return NextResponse.json(result)
  } catch (error) {
    logger.error(
      { context: 'api/notifications', error },
      'Failed to get notifications'
    )
    
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}
