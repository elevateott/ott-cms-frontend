/**
 * Event Emitter Service
 *
 * Provides a centralized way to emit and listen to events
 */

import { ReadableStreamController } from 'node:stream/web'
import { logError } from '@/utils/errorHandler'
import { EVENTS } from '@/constants/events'
import { EventEmitter } from 'events'
import { logger } from '@/utils/logger'

// Create the event bus with a higher limit of listeners
const eventBusInstance = new EventEmitter()
// Set a higher limit for listeners (default is 10)
if (typeof eventBusInstance.setMaxListeners === 'function') {
  eventBusInstance.setMaxListeners(50)
}

// Log the current number of listeners for debugging
const logListenerCount = () => {
  const counts: Record<string, number> = {}

  // Count listeners for each event
  Object.values(EVENTS).forEach((event) => {
    counts[event] = eventBusInstance.listenerCount(event)
  })

  logger.debug({ context: 'eventsService' }, `Current event listener counts:`, counts)
}

// Export the event bus
export const eventBus = eventBusInstance

// Store active connections with cleanup
class ConnectionManager {
  private clients: Map<string, ReadableStreamController<Uint8Array>> = new Map()
  private connectionTimes: Map<string, number> = new Map() // Track when connections were established
  private cleanupInterval: NodeJS.Timeout | null = null
  private readonly MAX_CONNECTION_AGE_MS = 4 * 60 * 60 * 1000 // 4 hours in milliseconds
  private static instance: ConnectionManager

  constructor() {
    // Start the cleanup interval
    this.startCleanupInterval()
  }

  // Singleton pattern
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager()
    }
    return ConnectionManager.instance
  }

  // Start the cleanup interval
  private startCleanupInterval(): void {
    // Only start if we're in a Node.js environment (not in the browser)
    if (typeof window === 'undefined' && !this.cleanupInterval) {
      logger.info(
        { context: 'eventsService' },
        'Started connection cleanup interval'
      )

      this.cleanupInterval = setInterval(() => {
        this.cleanupStaleConnections()
      }, 15 * 60 * 1000) // Check every 15 minutes
    }
  }

  // Clean up connections that have been open for too long
  private cleanupStaleConnections(): void {
    const now = Date.now()
    let staleCount = 0

    // Check each connection
    for (const [id, _] of this.clients) {
      const connectionTime = this.connectionTimes.get(id) || now
      const connectionAge = now - connectionTime

      // If the connection is older than the maximum age, remove it
      if (connectionAge > this.MAX_CONNECTION_AGE_MS) {
        logger.info(
          { context: 'eventsService' },
          `Removing stale connection ${id} (age: ${Math.round(connectionAge / 1000 / 60)} minutes)`,
        )
        this.removeClient(id)
        staleCount++
      }
    }

    if (staleCount > 0) {
      logger.info(
        { context: 'eventsService' },
        `Cleaned up ${staleCount} stale connections, ${this.clients.size} remaining`,
      )
    } else {
      logger.debug(
        { context: 'eventsService' },
        `No stale connections found, ${this.clients.size} active connections`,
      )
    }

    // Log current listener counts
    logListenerCount()
  }

  // Add a client
  addClient(id: string, controller: ReadableStreamController<Uint8Array>): void {
    // Remove existing connection if it exists
    if (this.clients.has(id)) {
      logger.info({ context: 'eventsService' }, `Cleaning up existing connection for client: ${id}`)
      this.removeClient(id)
    }

    this.clients.set(id, controller)
    this.connectionTimes.set(id, Date.now()) // Record the connection time

    logger.info(
      { context: 'eventsService' },
      `Client connected: ${id}, total clients: ${this.clients.size}`,
    )

    // Log current listener counts after adding a new client
    logListenerCount()
  }

  // Remove a client
  removeClient(id: string): void {
    // Check if client exists before attempting to remove
    if (!this.clients.has(id)) {
      logger.debug(
        { context: 'eventsService' },
        `Client ${id} already removed or doesn't exist, skipping removal`,
      )
      return
    }

    const controller = this.clients.get(id)
    if (controller) {
      try {
        // Only close the controller if it's not already closed
        // Note: There's no direct way to check if a controller is closed,
        // so we have to use try/catch
        controller.close()
      } catch (error) {
        // This is likely because the controller is already closed
        // Log at debug level instead of error since this is expected in some cases
        logger.debug(
          { context: 'eventsService' },
          `Controller for client ${id} already closed or in invalid state`,
        )
      }
    }

    // Always remove from the clients map
    this.clients.delete(id)
    this.connectionTimes.delete(id) // Remove the connection time

    logger.info(
      { context: 'eventsService' },
      `Client disconnected: ${id}, total clients: ${this.clients.size}`,
    )

    // Log current listener counts after removing a client
    logListenerCount()
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
  sendEventToClients(event: string, data: unknown): void {
    // Standardize event names (replace underscores with colons)
    const standardizedEvent = event.replace(/_/g, ':')

    // We'll use this encoder later when sending to each client
    const encoder = new TextEncoder()

    logger.info(
      { context: 'eventsService' },
      `Sending event to ${this.clients.size} clients:`,
      {
        originalEvent: event,
        standardizedEvent,
        data,
      },
    )

    if (this.clients.size === 0) {
      logger.warn(
        { context: 'eventsService' },
        `No clients connected to receive event: ${standardizedEvent}`,
      )
      return
    }

    this.clients.forEach((controller, id) => {
      try {
        logger.info(
          { context: 'eventsService' },
          `Sending event ${standardizedEvent} to client ${id}`,
        )
        // Ensure data is never undefined before stringifying
        const safeData = data ?? {}
        controller.enqueue(
          encoder.encode(`event: ${standardizedEvent}\ndata: ${JSON.stringify(safeData)}\n\n`),
        )
      } catch (error) {
        logger.error(
          { context: 'eventsService' },
          `Error sending event ${standardizedEvent} to client ${id}:`,
          error,
        )
        this.removeClient(id)
      }
    })
  }

  // Get the number of connected clients
  getClientCount(): number {
    return this.clients.size
  }

  // Clean up resources when the server is shutting down
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    // Close all connections
    for (const [id, _] of this.clients) {
      this.removeClient(id)
    }

    logger.info({ context: 'eventsService' }, 'Connection manager shut down')
  }
}

// Export the singleton instance
export const connectionManager = ConnectionManager.getInstance()

// Function to send events (used by other modules)
export function sendEventToClients(event: string, data: unknown): void {
  logger.info(
    { context: 'eventsService' },
    `sendEventToClients called with event: ${event}, data:`,
    data,
  )
  logger.info(
    { context: 'eventsService' },
    `Current client count: ${connectionManager.getClientCount()}`,
  )
  connectionManager.sendEventToClients(event, data)
}

// Helper functions for specific events
export function emitVideoCreated(id: string): void {
  logger.info(
    { context: 'eventsService' },
    `emitVideoCreated called for video ${id}`,
  )
  sendEventToClients(EVENTS.VIDEO_CREATED, { id })
}

export function emitVideoUpdated(id: string, isStatusChange: boolean = false): void {
  logger.info(
    { context: 'eventsService' },
    `emitVideoUpdated called for video ${id}`,
  )
  logger.info(
    { context: 'eventsService' },
    `isStatusChange: ${isStatusChange}`,
  )
  sendEventToClients(EVENTS.VIDEO_UPDATED, { id, isStatusChange })
}



