/**
 * Event Emitter Service
 *
 * Provides a centralized way to emit and listen to events
 */

import { ReadableStreamController } from 'node:stream/web'
import { logError } from '@/utils/errorHandler'
import { EVENTS } from '@/constants/events'

// Store active connections with cleanup
class ConnectionManager {
  private clients: Map<string, ReadableStreamController<Uint8Array>> = new Map()
  private static instance: ConnectionManager

  // Singleton pattern
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  // Add a client
  addClient(id: string, controller: ReadableStreamController<Uint8Array>): void {
    this.clients.set(id, controller)
    console.log(`Client connected: ${id}, total clients: ${this.clients.size}`)
  }

  // Remove a client
  removeClient(id: string): void {
    this.clients.delete(id)
    console.log(`Client disconnected: ${id}, total clients: ${this.clients.size}`)
  }

  // Send event to all clients
  sendEventToClients(event: string, data: any): void {
    const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    const encoder = new TextEncoder()

    console.log(`Sending event to ${this.clients.size} clients:`, { event, data })

    // Log more details for video_updated events
    if (event === 'video_updated' || event === 'video:updated') {
      console.log(`Sending ${event} event with id: ${data.id} to ${this.clients.size} clients`)

      // For video_updated events, also emit a special event for status changes
      if (data && data.id) {
        // This is a hack to force a refresh when a video status changes to ready
        // We'll emit a special event that will be caught by the client
        const specialEventData = `event: video:status:updated\ndata: ${JSON.stringify(data)}\n\n`
        console.log(`Also sending video:status:updated event for video ${data.id}`)

        this.clients.forEach((controller, id) => {
          try {
            controller.enqueue(encoder.encode(specialEventData))
          } catch (error) {
            logError(error, `EventEmitter.sendEventToClients(${id})`)
          }
        })

        // Also emit a direct page reload event
        const reloadEventData = `event: reload:page\ndata: ${JSON.stringify(data)}\n\n`
        console.log(`Also sending reload:page event for video ${data.id}`)

        this.clients.forEach((controller, id) => {
          try {
            controller.enqueue(encoder.encode(reloadEventData))
          } catch (error) {
            logError(error, `EventEmitter.sendEventToClients(${id})`)
          }
        })
      }
    }

    if (this.clients.size === 0) {
      console.warn(`No clients connected to receive event: ${event}`)
      return
    }

    this.clients.forEach((controller, id) => {
      try {
        console.log(`Sending event ${event} to client ${id}`)
        controller.enqueue(encoder.encode(eventData))
      } catch (error) {
        logError(error, `EventEmitter.sendEventToClients(${id})`)
        this.removeClient(id)
      }
    })
  }

  // Get the number of connected clients
  getClientCount(): number {
    return this.clients.size
  }
}

// Export the singleton instance
export const connectionManager = ConnectionManager.getInstance()

// Function to send events (used by other modules)
export function sendEventToClients(event: string, data: any): void {
  console.log(`sendEventToClients called with event: ${event}, data:`, data)
  console.log(`Current client count: ${connectionManager.getClientCount()}`)
  connectionManager.sendEventToClients(event, data)
}

// Helper functions for specific events
export function emitVideoCreated(id: string): void {
  console.log(`emitVideoCreated called for video ${id}`)
  sendEventToClients(EVENTS.VIDEO_CREATED, { id })
}

export function emitVideoUpdated(id: string): void {
  console.log(`emitVideoUpdated called for video ${id}`)
  sendEventToClients(EVENTS.VIDEO_UPDATED, { id })
}
