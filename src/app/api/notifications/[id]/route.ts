// src/app/api/notifications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * GET /api/notifications/[id]
 * 
 * Get a single notification by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get payload instance
    const payload = await getPayload({ config: configPromise })
    
    // Get notification
    const notification = await payload.findByID({
      collection: 'notifications',
      id,
    })
    
    return NextResponse.json(notification)
  } catch (error) {
    logger.error(
      { context: 'api/notifications/[id]', error },
      'Failed to get notification'
    )
    
    return NextResponse.json(
      { error: 'Failed to get notification' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/[id]
 * 
 * Update a notification
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Parse request body
    const body = await req.json()
    
    // Get payload instance
    const payload = await getPayload({ config: configPromise })
    
    // Update notification
    const notification = await payload.update({
      collection: 'notifications',
      id,
      data: body,
    })
    
    return NextResponse.json(notification)
  } catch (error) {
    logger.error(
      { context: 'api/notifications/[id]', error },
      'Failed to update notification'
    )
    
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
