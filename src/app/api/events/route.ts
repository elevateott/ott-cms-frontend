// src\app\api\events\route.ts
import { eventBus } from '@/services/events/eventEmitter'
import { headers } from 'next/headers'
import { EVENTS } from '@/constants/events'
import { logger } from '@/utils/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const headersList = await headers()
  const accept = headersList.get('accept')

  if (accept !== 'text/event-stream') {
    return new Response('Accepts SSE connections only', { status: 406 })
  }

  const connectionId = crypto.randomUUID()
  const encoder = new TextEncoder()
  let closed = false
  let keepAliveInterval: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      logger.info({ context: 'SSE', connectionId }, `Connection opened: ${connectionId}`)

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
      const listeners: Record<string, (...args: any[]) => void> = {}

      for (const event of Object.values(EVENTS)) {
        const listener = (data: any) => {
          if (!closed) {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
          }
        }
        eventBus.on(event, listener)
        listeners[event] = listener
      }

      const cleanup = () => {
        closed = true
        if (keepAliveInterval) clearInterval(keepAliveInterval)
        for (const [event, listener] of Object.entries(listeners)) {
          eventBus.off(event, listener)
        }
        try {
          controller.close()
        } catch (error) {
          logger.error({ context: 'SSE', connectionId, error }, `Cleanup error for ${connectionId}`)
        }
      }

      // Cleanup on stream end
      return cleanup
    },
    cancel() {
      closed = true
      if (keepAliveInterval) clearInterval(keepAliveInterval)
      logger.info({ context: 'SSE', connectionId }, `Connection closed: ${connectionId}`)
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

export function emitSSE(event: string, data: any) {
  eventBus.emit(event, data)
}
