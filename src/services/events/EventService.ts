import { emitSSE } from '@/app/api/events/route'

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
   * Emit an event to all connected SSE clients
   */
  emit(event: string, data: any): void {
    console.log(`📡 EventService: Emitting event ${event}:`, data)
    emitSSE(event, data)
  }

  /**
   * Emit a video update event
   */
  emitVideoUpdate(videoId: string, data: any): void {
    this.emit('video:updated', { videoId, ...data })
  }

  /**
   * Emit a video status update event
   */
  emitVideoStatusUpdate(videoId: string, status: string, data?: any): void {
    this.emit('video:status:updated', {
      videoId,
      status,
      timestamp: new Date().toISOString(),
      ...data,
    })
  }

  /**
   * Emit a video creation event
   */
  emitVideoCreated(videoId: string, data?: any): void {
    this.emit('video:created', {
      videoId,
      timestamp: new Date().toISOString(),
      ...data,
    })
  }

  /**
   * Emit a video deletion event
   */
  emitVideoDeleted(videoId: string): void {
    this.emit('video:deleted', {
      videoId,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Emit a video upload progress event
   */
  emitUploadProgress(videoId: string, progress: number): void {
    this.emit('video:upload:progress', {
      videoId,
      progress,
      timestamp: new Date().toISOString(),
    })
  }
}

// Export singleton instance
export const eventService = EventService.getInstance()
