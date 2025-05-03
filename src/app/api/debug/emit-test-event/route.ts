/**
 * Debug endpoint to emit test events
 * This is useful for testing the event system without having to trigger actual webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { EVENTS } from '@/constants/events'
import { logger } from '@/utils/logger'
import { eventBus, sendEventToClients } from '@/services/events/eventEmitter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, data } = body

    if (!event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    // Log the request
    logger.info(
      { context: 'debug/emit-test-event' },
      `Emitting test event: ${event}`,
      { event, data }
    )

    // Emit the event directly to the server-side event bus
    eventBus.emit(event, data || {})

    // Also send to SSE clients
    sendEventToClients(event, data || {})

    return NextResponse.json({
      success: true,
      message: `Event ${event} emitted successfully`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error(
      { context: 'debug/emit-test-event' },
      `Error emitting test event: ${error instanceof Error ? error.message : String(error)}`
    )
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return a list of available events for testing
  const events = Object.entries(EVENTS).map(([key, value]) => ({ key, value }))
  
  return NextResponse.json({
    events,
    usage: {
      method: 'POST',
      body: {
        event: 'video:created',
        data: { id: 'test-123', title: 'Test Video' }
      }
    }
  })
}
