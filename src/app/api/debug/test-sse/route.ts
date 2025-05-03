/**
 * Debug endpoint to test the SSE connection
 * This endpoint emits a test event to all connected clients
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { eventBus, connectionManager, sendEventToClients } from '@/services/events/eventEmitter'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const event = searchParams.get('event') || 'video:created'
  const data = {
    id: 'test-' + Date.now(),
    title: 'Test Video',
    timestamp: new Date().toISOString(),
    source: 'test-sse-endpoint'
  }

  logger.info(
    { context: 'debug/test-sse' },
    `Testing SSE connection with event: ${event}`,
    { event, data, clientCount: connectionManager.getClientCount() }
  )

  // Emit the event directly to the event bus
  eventBus.emit(event, data)
  
  // Also send to SSE clients
  sendEventToClients(event, data)

  return NextResponse.json({
    success: true,
    message: `Event ${event} emitted to ${connectionManager.getClientCount()} clients`,
    event,
    data,
    clientCount: connectionManager.getClientCount()
  })
}
