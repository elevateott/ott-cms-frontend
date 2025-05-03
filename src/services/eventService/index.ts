import { EVENTS } from '@/constants/events'
import { logger } from '@/utils/logger'
import { eventBus, sendEventToClients } from '../../services/events/eventEmitter'

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
  async emit(event: keyof typeof EVENTS, data: unknown): Promise<void> {
    try {
      logger.info({ context: 'EventService', event, data }, `Emitting event ${event}`)

      // Create payload with timestamp and source
      const payload = {
        ...(typeof data === 'object' && data !== null
          ? (data as Record<string, unknown>)
          : { data }),
        timestamp: new Date().toISOString(),
        source: 'server',
      }

      logger.info(`📢 EventService: Emitting event ${event}`, payload)

      // Internal listeners (hooks, dev logs)
      eventBus.emit(event, payload)

      // Push to connected SSE clients
      sendEventToClients(event, payload)
    } catch (error) {
      logger.error({ context: 'EventService', event, error }, `Error emitting event ${event}`)
      throw error
    }
  }

  /**
   * Emit multiple events at once
   * @param events Array of event objects containing event name and data
   */
  async emitMultiple(events: Array<{ event: keyof typeof EVENTS; data: unknown }>): Promise<void> {
    const results = await Promise.allSettled(
      events.map(({ event, data }) => this.emit(event, data)),
    )

    const errors = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
    if (errors.length > 0) {
      for (const error of errors) {
        logger.error(
          { context: 'EventService.emitMultiple', error },
          'Failed to emit one or more events',
        )
      }
      throw new Error(`emitMultiple failed for ${errors.length} event(s)`)
    }
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()
