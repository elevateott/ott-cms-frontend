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
    // Remove existing connection if it exists
    if (this.clients.has(id)) {
      console.log(`Cleaning up existing connection for client: ${id}`)
      this.removeClient(id)
    }

    this.clients.set(id, controller)
    console.log(`Client connected: ${id}, total clients: ${this.clients.size}`)
  }

  // Remove a client
  removeClient(id: string): void {
    const controller = this.clients.get(id)
    if (controller) {
      try {
        controller.close()
      } catch (error) {
        console.error(`Error closing controller for client ${id}:`, error)
      }
    }
    this.clients.delete(id)
    console.log(`Client disconnected: ${id}, total clients: ${this.clients.size}`)
  }

  // Add a method to check if a client exists
  hasClient(id: string): boolean {
    return this.clients.has(id)
  }

  // Add a method to get the total number of clients
  get totalClients(): number {
    return this.clients.size
  }

  // Send event to all clients
  sendEventToClients(event: string, data: any): void {
    const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    const encoder = new TextEncoder()

    console.log(`🔍 DEBUG [EventEmitter] Sending event to ${this.clients.size} clients:`, {
      event,
      data,
    })

    // Standardize event names
    const standardizedEvent = event.replace(/_/g, ':')

    if (this.clients.size === 0) {
      console.warn(`🔍 DEBUG [EventEmitter] No clients connected to receive event: ${standardizedEvent}`)
      return
    }

    this.clients.forEach((controller, id) => {
      try {
        console.log(`🔍 DEBUG [EventEmitter] Sending event ${standardizedEvent} to client ${id}`)
        controller.enqueue(encoder.encode(
          `event: ${standardizedEvent}\ndata: ${JSON.stringify(data)}\n\n`
        ))
      } catch (error) {
        console.error(
          `🔍 DEBUG [EventEmitter] Error sending event ${standardizedEvent} to client ${id}:`,
          error,
        )
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
  console.log(`🔍 DEBUG [EventEmitter] sendEventToClients called with event: ${event}, data:`, data)
  console.log(`🔍 DEBUG [EventEmitter] Current client count: ${connectionManager.getClientCount()}`)
  connectionManager.sendEventToClients(event, data)
}

// Helper functions for specific events
export function emitVideoCreated(id: string): void {
  console.log(`🔍 DEBUG [EventEmitter] emitVideoCreated called for video ${id}`)
  sendEventToClients(EVENTS.VIDEO_CREATED, { id })
}

export function emitVideoUpdated(id: string, isStatusChange: boolean = false): void {
  console.log(`🔍 DEBUG [EventEmitter] emitVideoUpdated called for video ${id}`)
  console.log(`🔍 DEBUG [EventEmitter] isStatusChange: ${isStatusChange}`)
  sendEventToClients(EVENTS.VIDEO_UPDATED, { id, isStatusChange })
}


