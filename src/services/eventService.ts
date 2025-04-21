// src\services\eventService.ts

import { EVENTS } from '@/constants/events'
import { eventBus } from '@/utilities/eventBus'
import { connectionManager } from '@/services/events/eventEmitter'

/**
 * Service for handling event emission across the application
 * Handles both server-side events and client-side event bus
 */
export class EventService {
  private static instance: EventService
  private constructor() {}

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  /**
   * Emit an event
   * @param event The event name
   * @param data The event data
   */
  async emit(event: keyof typeof EVENTS, data: any): Promise<void> {
    try {
      const enriched = {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'server',
      }

      console.log(`📢 Emitting event: ${event}`, enriched)

      // In-app listeners
      eventBus.emit(event, enriched)

      // SSE clients
      connectionManager.sendEventToClients(event, enriched) // ✅ This makes the client see it
    } catch (error) {
      console.error(`Error emitting event ${event}:`, error)
      throw error
    }
  }

  /**
   * Emit multiple events at once
   * @param events Array of event objects containing event name and data
   */
  async emitMultiple(events: Array<{ event: keyof typeof EVENTS; data: any }>): Promise<void> {
    const results = await Promise.allSettled(
      events.map(({ event, data }) => this.emit(event, data)),
    )

    const errors = results.filter((r) => r.status === 'rejected')
    if (errors.length > 0) {
      console.error(`❌ ${errors.length} emit(s) failed`)
      throw new Error(`${errors.length} events failed to emit`)
    }
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()
