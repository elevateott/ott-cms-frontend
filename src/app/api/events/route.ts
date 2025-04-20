import { EventEmitter } from 'events'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

class SSEManager {
  private static instance: SSEManager
  private eventEmitter: EventEmitter
  private connections: Map<string, { timestamp: number, active: boolean }>
  private readonly MAX_CONNECTIONS = 50
  private cleanupInterval: NodeJS.Timeout

  private constructor() {
    this.eventEmitter = new EventEmitter()
    this.eventEmitter.setMaxListeners(this.MAX_CONNECTIONS * 2)
    this.connections = new Map()

    // Cleanup stale connections every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections()
    }, 60000)
  }

  private cleanupStaleConnections() {
    const now = Date.now()
    const staleTimeout = 5 * 60 * 1000 // 5 minutes

    for (const [id, connection] of this.connections.entries()) {
      if (!connection.active && (now - connection.timestamp > staleTimeout)) {
        this.connections.delete(id)
        console.log(`Cleaned up stale connection: ${id}. Total connections: ${this.connections.size}`)
      }
    }
  }

  public static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager()
    }
    return SSEManager.instance
  }

  public canAcceptConnection(): boolean {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.active).length
    return activeConnections < this.MAX_CONNECTIONS
  }

  public addConnection(id: string): void {
    this.connections.set(id, { timestamp: Date.now(), active: true })
    console.log(`SSE Connection added: ${id}. Total connections: ${this.connections.size}`)
  }

  public removeConnection(id: string): void {
    const connection = this.connections.get(id)
    if (connection) {
      connection.active = false
      connection.timestamp = Date.now()
      console.log(`SSE Connection marked inactive: ${id}. Total connections: ${this.connections.size}`)
    }
  }

  public getEventEmitter(): EventEmitter {
    return this.eventEmitter
  }
}

const sseManager = SSEManager.getInstance()

export async function GET() {
  const headersList = await headers()
  const accept = headersList.get('accept')

  if (accept !== 'text/event-stream') {
    return new Response('Accepts SSE connections only', { status: 406 })
  }

  if (!sseManager.canAcceptConnection()) {
    return new Response('Too many connections', { status: 503 })
  }

  const connectionId = crypto.randomUUID()
  const encoder = new TextEncoder()
  let closed = false
  let keepAliveInterval: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addConnection(connectionId)

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({
          timestamp: Date.now(),
          connectionId
        })}\n\n`)
      )

      // Keep-alive interval
      keepAliveInterval = setInterval(() => {
        if (closed) {
          if (keepAliveInterval) clearInterval(keepAliveInterval)
          return
        }

        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`))
        } catch (error) {
          console.error(`Connection ${connectionId} error during keep-alive:`, error)
          cleanup()
        }
      }, 30000)

      // Event handler
      const handler = (event: string, data: any) => {
        if (closed) return

        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        } catch (error) {
          console.error(`Connection ${connectionId} error sending event:`, error)
          cleanup()
        }
      }

      sseManager.getEventEmitter().on('sse', handler)

      const cleanup = () => {
        closed = true
        if (keepAliveInterval) clearInterval(keepAliveInterval)
        sseManager.getEventEmitter().off('sse', handler)
        sseManager.removeConnection(connectionId)
        try {
          controller.close()
        } catch (error) {
          console.error(`Connection ${connectionId} error during cleanup:`, error)
        }
      }

      // Cleanup on stream end
      return cleanup
    },
    cancel() {
      closed = true
      if (keepAliveInterval) clearInterval(keepAliveInterval)
      sseManager.removeConnection(connectionId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}

export function emitSSE(event: string, data: any) {
  sseManager.getEventEmitter().emit('sse', event, data)
}



