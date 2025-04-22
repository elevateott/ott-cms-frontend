import { EVENTS } from '@/constants/events'
import { eventBus } from '@/utilities/eventBus'
import { logger } from '@/utils/logger'

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
      logger.info({ context: 'EventService', event, data }, `Emitting event ${event}`)

      // Emit to client-side event bus
      eventBus.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'server',
      })
    } catch (error) {
      logger.error({ context: 'EventService', event, error }, `Error emitting event ${event}`)
      throw error
    }
  }

  /**
   * Emit multiple events at once
   * @param events Array of event objects containing event name and data
   */
  async emitMultiple(events: Array<{ event: keyof typeof EVENTS; data: any }>): Promise<void> {
    try {
      await Promise.all(events.map(({ event, data }) => this.emit(event, data)))
    } catch (error) {
      logger.error({ context: 'EventService', error }, 'Error emitting multiple events')
      throw error
    }
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()
