// src/app/api/notifications/mark-read/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * POST /api/notifications/mark-read
 * 
 * Mark multiple notifications as read
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    const { ids } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Expected array of notification IDs.' },
        { status: 400 }
      )
    }
    
    // Get payload instance
    const payload = await getPayload({ config: configPromise })
    
    // Update each notification
    const results = await Promise.allSettled(
      ids.map(id => 
        payload.update({
          collection: 'notifications',
          id,
          data: {
            read: true,
          },
        })
      )
    )
    
    // Count successful updates
    const successful = results.filter(result => result.status === 'fulfilled').length
    
    return NextResponse.json({
      success: true,
      message: `Marked ${successful} of ${ids.length} notifications as read.`,
      updatedCount: successful,
    })
  } catch (error) {
    logger.error(
      { context: 'api/notifications/mark-read', error },
      'Failed to mark notifications as read'
    )
    
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}
