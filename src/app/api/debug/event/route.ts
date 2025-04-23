/**
 * Debug endpoint for testing the event system
 * This endpoint allows you to emit test events to verify the event system is working
 */

import { NextRequest, NextResponse } from 'next/server'
import { EVENTS } from '@/constants/events'
import { logger } from '@/utils/logger'
import { eventService } from '@/services/eventService'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { event, data } = body

    // Validate the event name
    if (!event || typeof event !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Event name is required and must be a string' },
        { status: 400 }
      )
    }

    // Check if the event is valid
    const eventNames = Object.values(EVENTS)
    if (!eventNames.includes(event)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid event name. Must be one of: ${eventNames.join(', ')}` 
        },
        { status: 400 }
      )
    }

    logger.info({ context: 'debug/event', event, data }, `Emitting debug event: ${event}`)

    // Emit the event
    await eventService.emit(event as keyof typeof EVENTS, data || {})

    return NextResponse.json({
      success: true,
      message: `Event ${event} emitted successfully`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error(
      { context: 'debug/event', error },
      `Error emitting debug event: ${error instanceof Error ? error.message : String(error)}`
    )
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return a list of available events for testing
  const events = Object.entries(EVENTS).map(([key, value]) => ({ key, value }))
  
  return NextResponse.json({
    success: true,
    message: 'Available events for testing',
    events,
    usage: {
      method: 'POST',
      body: {
        event: 'video:created',
        data: { id: 'test-video-id', title: 'Test Video' }
      }
    }
  })
}
