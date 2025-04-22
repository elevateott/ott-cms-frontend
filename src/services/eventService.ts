import { logger } from '@/utils/logger'
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
  async emit(event: keyof typeof EVENTS, data: Record<string, unknown>): Promise<void> {
    try {
      const enriched = {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'server',
      }

      logger.info({ context: 'services/eventService' }, `📢 Emitting event: ${event}`, enriched)

      try {
        // Get the actual event string value from the EVENTS object
        const eventValue = EVENTS[event]

        // In-app listeners
        eventBus.emit(eventValue, enriched)

        // SSE clients
        connectionManager.sendEventToClients(eventValue, enriched) // ✅ This makes the client see it
      } catch (emitError) {
        logger.warn(
          { context: 'services/eventService', error: emitError },
          `Error in event emission for ${event}, falling back to direct emission`,
        )

        // Fallback: try direct emission with the event name
        try {
          eventBus.emit(event, enriched)
          connectionManager.sendEventToClients(event, enriched)
        } catch (fallbackError) {
          logger.error(
            { context: 'services/eventService', error: fallbackError },
            `Fallback emission also failed for ${event}`,
          )
          throw fallbackError
        }
      }
    } catch (error) {
      logger.error({ context: 'services/eventService' }, `Error emitting event ${event}:`, error)
      throw error
    }
  }

  /**
   * Emit multiple events at once
   * @param events Array of event objects containing event name and data
   */
  async emitMultiple(
    events: Array<{ event: keyof typeof EVENTS; data: Record<string, unknown> }>,
  ): Promise<void> {
    const results = await Promise.allSettled(
      events.map(({ event, data }) => this.emit(event, data)),
    )

    const errors = results.filter((r) => r.status === 'rejected')
    if (errors.length > 0) {
      logger.error({ context: 'services/eventService' }, `❌ ${errors.length} emit(s) failed`)
      throw new Error(`${errors.length} events failed to emit`)
    }
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()
