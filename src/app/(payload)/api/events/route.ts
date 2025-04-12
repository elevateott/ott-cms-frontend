/**
 * Server-Sent Events API
 *
 * Provides a stream of events to clients
 */

import { NextRequest } from 'next/server'
import { connectionManager } from '@/services/events/eventEmitter'
import { logError } from '@/utils/errorHandler'
import crypto from 'crypto'

/**
 * GET /api/events
 *
 * Create a server-sent events stream
 */
export async function GET(req: NextRequest) {
  // Generate a unique client ID
  const clientId = crypto.randomUUID()

  const stream = new ReadableStream({
    start(controller) {
      try {
        // Add client to connection manager
        connectionManager.addClient(clientId, controller)

        // Send initial connection message
        controller.enqueue(new TextEncoder().encode('event: connected\ndata: {}\n\n'))

        // Remove client when connection is closed
        req.signal.addEventListener('abort', () => {
          connectionManager.removeClient(clientId)
        })
      } catch (error) {
        logError(error, 'EventsAPI.GET')
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}



