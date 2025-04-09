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
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback as EventCallback)

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter((cb) => cb !== callback)
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
      this.onceEvents[event] = this.onceEvents[event].filter((cb) => cb !== callback)
    }
  }

  /**
   * Emit an event
   * @param event The event name
   * @param data The data to pass to the callbacks
   */
  emit<T = any>(event: string, data?: T): void {
    // Call regular subscribers
    if (this.events[event]) {
      this.events[event].forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }

    // Call once subscribers
    if (this.onceEvents[event]) {
      const callbacks = [...this.onceEvents[event]]
      this.onceEvents[event] = []
      callbacks.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in once event listener for ${event}:`, error)
        }
      })
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
