import { EVENTS } from '@/constants/events'
import { eventBus } from '@/utilities/eventBus'

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
      console.log(`📢 EventService: Emitting event ${event}`, data)

      // Emit to client-side event bus
      eventBus.emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'server',
      })

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
    try {
      await Promise.all(events.map(({ event, data }) => this.emit(event, data)))
    } catch (error) {
      console.error('Error emitting multiple events:', error)
      throw error
    }
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()