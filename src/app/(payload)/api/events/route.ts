/**
 * Server-Sent Events API
 *
 * Provides a stream of events to clients
 */

import { NextRequest } from 'next/server';
import { connectionManager } from '@/services/events/eventEmitter';
import { logError } from '@/utils/errorHandler';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/events
 *
 * Create a server-sent events stream
 */
export async function GET(req: NextRequest) {
  try {
    const clientId = crypto.randomUUID();
    console.log(`New client connection attempt: ${clientId}`);

    // Set headers for SSE
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const stream = new ReadableStream({
      start(controller) {
        try {
          // Add client to connection manager
          connectionManager.addClient(clientId, controller);

          // Send initial connection message
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

          // Remove client when connection is closed
          req.signal.addEventListener('abort', () => {
            console.log(`Connection aborted for client: ${clientId}`);
            connectionManager.removeClient(clientId);
          });
        } catch (error) {
          console.error('Error in stream start:', error);
          logError(error, 'EventsAPI.GET.stream.start');
          controller.error(error);
        }
      },
      cancel() {
        console.log(`Stream cancelled for client: ${clientId}`);
        connectionManager.removeClient(clientId);
      }
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error('Error in EventsAPI.GET:', error);
    logError(error, 'EventsAPI.GET');
    return new Response('Internal Server Error', { status: 500 });
  }
}

