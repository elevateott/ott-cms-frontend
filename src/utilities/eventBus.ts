/**
 * Client-Side Event Bus
 *
 * A simple event bus for client-side communication between components
 */

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
    console.log(`🔍 DEBUG [EventBus] Subscribing to event: ${event}`)

    if (!this.events[event]) {
      this.events[event] = []
      console.log(`🔍 DEBUG [EventBus] Created new event array for: ${event}`)
    }

    this.events[event].push(callback as EventCallback)
    console.log(
      `🔍 DEBUG [EventBus] Added callback to event: ${event}, total listeners: ${this.events[event].length}`,
    )

    // Return unsubscribe function
    return () => {
      console.log(`🔍 DEBUG [EventBus] Unsubscribing from event: ${event}`)
      if (this.events[event]) {
        const prevLength = this.events[event].length
        this.events[event] = this.events[event].filter((cb) => cb !== callback)
        console.log(
          `🔍 DEBUG [EventBus] Removed callback from event: ${event}, listeners before: ${prevLength}, after: ${this.events[event].length}`,
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
    console.log(`🔍 DEBUG [EventBus] Emitting event: ${event}`, data)

    // Call regular subscribers
    if (this.events[event]) {
      console.log(
        `🔍 DEBUG [EventBus] Found ${this.events[event].length} regular listeners for event: ${event}`,
      )
      this.events[event].forEach((callback, index) => {
        try {
          console.log(`🔍 DEBUG [EventBus] Calling regular listener #${index} for event: ${event}`)
          callback(data)
        } catch (error) {
          console.error(`🔍 DEBUG [EventBus] Error in event listener for ${event}:`, error)
        }
      })
    } else {
      console.log(`🔍 DEBUG [EventBus] No regular listeners found for event: ${event}`)
    }

    // Call once subscribers
    if (this.onceEvents[event]) {
      console.log(
        `🔍 DEBUG [EventBus] Found ${this.onceEvents[event].length} once listeners for event: ${event}`,
      )
      const callbacks = [...this.onceEvents[event]]
      this.onceEvents[event] = []
      callbacks.forEach((callback, index) => {
        try {
          console.log(`🔍 DEBUG [EventBus] Calling once listener #${index} for event: ${event}`)
          callback(data)
        } catch (error) {
          console.error(`🔍 DEBUG [EventBus] Error in once event listener for ${event}:`, error)
        }
      })
    } else {
      console.log(`🔍 DEBUG [EventBus] No once listeners found for event: ${event}`)
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

// Event names
export const EVENTS = {
  // Video events
  VIDEO_UPDATED: 'video_updated',
  VIDEO_CREATED: 'video_created',
  VIDEO_DELETED: 'video_deleted',
  VIDEO_UPLOAD_STARTED: 'video_upload_started',
  VIDEO_UPLOAD_PROGRESS: 'video_upload_progress',
  VIDEO_UPLOAD_COMPLETED: 'video_upload_completed',
  VIDEO_UPLOAD_ERROR: 'video_upload_error',

  // UI events
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  NOTIFICATION: 'notification',

  // Navigation events
  NAVIGATION_START: 'navigation_start',
  NAVIGATION_END: 'navigation_end',
}
