// src\app\api\events\stream\route.ts
import { headers } from 'next/headers'
import { EVENTS } from '@/constants/events'
import { logger } from '@/utils/logger'
import { eventBus, connectionManager } from '@/services/events/eventEmitter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const headersList = await headers()
  const accept = headersList.get('accept')

  logger.info({ context: 'SSE' }, `SSE stream requested with Accept header: ${accept}`)

  if (accept !== 'text/event-stream') {
    logger.warn({ context: 'SSE' }, `Rejecting connection with invalid Accept header: ${accept}`)
    return new Response('Accepts SSE connections only', { status: 406 })
  }

  logger.info({ context: 'SSE' }, 'Valid SSE connection request received')

  const connectionId = crypto.randomUUID()
  const encoder = new TextEncoder()
  let closed = false
  let keepAliveInterval: NodeJS.Timeout | null = null
  // Define listeners in the outer scope so it's accessible to both start and cancel
  const listeners: Record<string, (data: unknown) => void> = {}

  const stream = new ReadableStream({
    start(controller) {
      logger.info({ context: 'SSE', connectionId }, `Connection opened: ${connectionId}`)

      // Register this client with the connection manager
      connectionManager.addClient(connectionId, controller)

      // Send initial connection message
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            timestamp: Date.now(),
            connectionId,
          })}\n\n`,
        ),
      )

      // Keep-alive interval
      keepAliveInterval = setInterval(() => {
        if (closed) return
        controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`))
      }, 30000)

      // Register all event listeners dynamically
      // listeners is defined in the outer scope

      // Log the number of listeners before adding new ones
      logger.debug(
        { context: 'SSE', connectionId },
        `Listener counts before adding new listeners for connection ${connectionId}:`,
      )

      Object.values(EVENTS).forEach((event) => {
        logger.debug(
          { context: 'SSE', connectionId },
          `${event}: ${eventBus.listenerCount(event)} listeners`,
        )
      })

      // Add listeners for each event
      for (const event of Object.values(EVENTS)) {
        const listener = (data: unknown) => {
          if (!closed) {
            try {
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
              )
            } catch (error) {
              // If we can't enqueue, the connection is probably closed
              logger.debug(
                { context: 'SSE', connectionId, event },
                `Error enqueueing event to client ${connectionId}, marking as closed`,
                error,
              )
              closed = true
            }
          }
        }

        // Add the listener and store it for later cleanup
        eventBus.on(event, listener)
        listeners[event] = listener

        logger.debug(
          { context: 'SSE', connectionId, event },
          `Added listener for ${event} to connection ${connectionId}, now ${eventBus.listenerCount(event)} listeners`,
        )
      }

      const cleanup = () => {
        // If already closed, don't try to clean up again
        if (closed) {
          logger.debug(
            { context: 'SSE', connectionId },
            `Cleanup called for already closed connection ${connectionId}, skipping`,
          )
          return
        }

        logger.info(
          { context: 'SSE', connectionId },
          `Starting cleanup for connection ${connectionId}`,
        )

        // Mark as closed first to prevent race conditions
        closed = true

        // Clear the keep-alive interval
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval)
          logger.debug(
            { context: 'SSE', connectionId },
            `Cleared keep-alive interval for connection ${connectionId}`,
          )
        }

        // Log listener counts before removal
        logger.debug(
          { context: 'SSE', connectionId },
          `Listener counts before removal for connection ${connectionId}:`,
        )

        Object.values(EVENTS).forEach((event) => {
          logger.debug(
            { context: 'SSE', connectionId },
            `${event}: ${eventBus.listenerCount(event)} listeners`,
          )
        })

        // Remove event listeners
        // Check if listeners object is populated before trying to iterate over it
        if (Object.keys(listeners).length > 0) {
          for (const [event, listener] of Object.entries(listeners)) {
            try {
              eventBus.off(event, listener)
              logger.debug(
                { context: 'SSE', connectionId, event },
                `Removed listener for ${event} from connection ${connectionId}, now ${eventBus.listenerCount(event)} listeners`,
              )
            } catch (error) {
              logger.error(
                { context: 'SSE', connectionId, event, error },
                `Error removing listener for ${event} from connection ${connectionId}`,
              )
            }
          }
        } else {
          logger.debug(
            { context: 'SSE', connectionId },
            `No listeners found for connection ${connectionId}, possibly cleaned up before start completed`,
          )
        }

        try {
          // Remove client from connection manager
          // This will also try to close the controller
          connectionManager.removeClient(connectionId)
          logger.debug(
            { context: 'SSE', connectionId },
            `Removed client ${connectionId} from connection manager`,
          )
        } catch (error) {
          logger.error(
            { context: 'SSE', connectionId, error },
            `Error removing client ${connectionId} from connection manager`,
          )
        }

        logger.info({ context: 'SSE', connectionId }, `Connection cleaned up: ${connectionId}`)
      }

      // Cleanup on stream end
      return cleanup
    },
    cancel() {
      // If already closed, don't try to clean up again
      if (closed) {
        logger.debug(
          { context: 'SSE', connectionId },
          `Cancel called for already closed connection ${connectionId}, skipping`,
        )
        return
      }

      logger.info({ context: 'SSE', connectionId }, `Cancelling connection ${connectionId}`)

      // Mark as closed first to prevent race conditions
      closed = true

      // Clear the keep-alive interval
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval)
        logger.debug(
          { context: 'SSE', connectionId },
          `Cleared keep-alive interval for connection ${connectionId}`,
        )
      }

      // Remove event listeners
      // Check if listeners object is populated before trying to iterate over it
      if (Object.keys(listeners).length > 0) {
        for (const [event, listener] of Object.entries(listeners)) {
          try {
            eventBus.off(event, listener)
            logger.debug(
              { context: 'SSE', connectionId, event },
              `Removed listener for ${event} from connection ${connectionId}, now ${eventBus.listenerCount(event)} listeners`,
            )
          } catch (error) {
            logger.error(
              { context: 'SSE', connectionId, event, error },
              `Error removing listener for ${event} from connection ${connectionId}`,
            )
          }
        }
      } else {
        logger.debug(
          { context: 'SSE', connectionId },
          `No listeners found for connection ${connectionId}, possibly cancelled before start completed`,
        )
      }

      // Remove client from connection manager
      connectionManager.removeClient(connectionId)

      logger.info({ context: 'SSE', connectionId }, `Connection cancelled: ${connectionId}`)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export function emitSSE(event: string, data: unknown) {
  eventBus.emit(event, data)
}
