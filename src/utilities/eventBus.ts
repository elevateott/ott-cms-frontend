/**
 * Client-Side Event Bus
 *
 * A simple event bus for client-side communication between components
 */

// src\utilities\eventBus.ts
import { clientLogger } from '@/utils/clientLogger'

type EventCallback<T = any> = (data?: T) => void

class EventBus {
  private events: Record<string, EventCallback[]> = {}
  private onceEvents: Record<string, EventCallback[]> = {}
  private static instance: EventBus

  // Singleton pattern
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  /**
   * Subscribe to an event
   * @param event The event name
   * @param callback The callback function
   * @returns A function to unsubscribe
   */
  on<T = any>(event: string, callback: EventCallback<T>): () => void {
    clientLogger.debug(`Subscribing to event: ${event}`, 'EventBus')

    if (!this.events[event]) {
      this.events[event] = []
      clientLogger.debug(`Created new event array for: ${event}`, 'EventBus')
    }

    this.events[event].push(callback as EventCallback)
    clientLogger.debug(
      `Added callback to event: ${event}, total listeners: ${this.events[event].length}`,
      'EventBus',
    )

    // Return unsubscribe function
    return () => {
      clientLogger.debug(`Unsubscribing from event: ${event}`, 'EventBus')
      if (this.events[event]) {
        const prevLength = this.events[event].length
        this.events[event] = this.events[event].filter((cb) => cb !== callback)
        clientLogger.debug(
          `Removed callback from event: ${event}, listeners before: ${prevLength}, after: ${this.events[event].length}`,
          'EventBus',
        )
      }
    }
  }

  /**
   * Subscribe to an event once
   * @param event The event name
   * @param callback The callback function
   * @returns A function to unsubscribe
   */
  once<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.onceEvents[event]) {
      this.onceEvents[event] = []
    }
    this.onceEvents[event].push(callback as EventCallback)

    // Return unsubscribe function
    return () => {
      if (this.onceEvents[event]) {
        this.onceEvents[event] = this.onceEvents[event].filter((cb) => cb !== callback)
      }
    }
  }

  /**
   * Emit an event
   * @param event The event name
   * @param data The data to pass to the callbacks
   */
  emit<T = any>(event: string, data?: T): void {
    clientLogger.debug(`Emitting event: ${event}`, 'EventBus', data)

    // Call regular subscribers
    if (this.events[event]) {
      clientLogger.debug(
        `Found ${this.events[event].length} regular listeners for event: ${event}`,
        'EventBus',
      )
      this.events[event].forEach((callback, index) => {
        try {
          clientLogger.debug(`Calling regular listener #${index} for event: ${event}`, 'EventBus')
          callback(data)
        } catch (error) {
          clientLogger.error(`Error in event listener for ${event}`, 'EventBus', { error })
        }
      })
    } else {
      clientLogger.debug(`No regular listeners found for event: ${event}`, 'EventBus')
    }

    // Call once subscribers
    if (this.onceEvents[event]) {
      clientLogger.debug(
        `Found ${this.onceEvents[event].length} once listeners for event: ${event}`,
        'EventBus',
      )
      const callbacks = [...this.onceEvents[event]]
      this.onceEvents[event] = []
      callbacks.forEach((callback, index) => {
        try {
          clientLogger.debug(`Calling once listener #${index} for event: ${event}`, 'EventBus')
          callback(data)
        } catch (error) {
          clientLogger.error(`Error in once event listener for ${event}`, 'EventBus', { error })
        }
      })
    } else {
      clientLogger.debug(`No once listeners found for event: ${event}`, 'EventBus')
    }
  }

  /**
   * Remove all listeners for an event
   * @param event The event name
   */
  off(event: string): void {
    this.events[event] = []
    this.onceEvents[event] = []
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.events = {}
    this.onceEvents = {}
  }
}

// Create a singleton instance
export const eventBus = EventBus.getInstance()

// DEPRECATED: Use the EVENTS from constants/events.ts instead
// This is kept for backward compatibility
export const EVENTS = {
  // Video events
  VIDEO_UPDATED: 'video:updated',
  VIDEO_CREATED: 'video:created',
  VIDEO_DELETED: 'video:deleted',
  VIDEO_UPLOAD_STARTED: 'video:upload:started',
  VIDEO_UPLOAD_PROGRESS: 'video:upload:progress',
  VIDEO_UPLOAD_COMPLETED: 'video:upload:completed',
  VIDEO_UPLOAD_ERROR: 'video:upload:error',
  VIDEO_STATUS_READY: 'video:status:ready',
  VIDEO_STATUS_UPDATED: 'video:status:updated',

  // UI events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  NOTIFICATION: 'notification',

  // Navigation events
  NAVIGATION_START: 'navigation:start',
  NAVIGATION_END: 'navigation:end',
}
