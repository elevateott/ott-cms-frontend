import { EVENTS } from '@/constants/events'

export interface EventMetadata {
  type: 'creation' | 'update' | 'status' | 'upload' | 'error'
  action: string
  isStatusChange?: boolean
  status?: string
  progress?: number
  error?: string
}

export interface EventData {
  id: string
  source: 'webhook' | 'uploader' | 'client' | 'system'
  timestamp: number
  metadata: EventMetadata
  [key: string]: any // Allow additional properties
}

export class EventService {
  private static instance: EventService
  private eventEmitter: (eventName: string, data: EventData) => void

  private constructor(emitter: (eventName: string, data: EventData) => void) {
    this.eventEmitter = emitter
  }

  public static getInstance(emitter?: (eventName: string, data: EventData) => void): EventService {
    if (!EventService.instance && emitter) {
      EventService.instance = new EventService(emitter)
    }
    return EventService.instance
  }

  private emit(eventName: string, data: Partial<EventData>) {
    const eventData: EventData = {
      ...data,
      timestamp: Date.now(),
      source: data.source || 'system',
      metadata: {
        type: data.metadata?.type || 'update',
        action: data.metadata?.action || eventName,
        ...data.metadata
      },
      id: data.id! // Assert that id exists
    }

    console.log(`📢 Emitting ${eventName}:`, eventData)
    this.eventEmitter(eventName, eventData)

    // Automatically emit refresh list view for certain events
    if (this.shouldRefreshList(eventName)) {
      this.emitRefreshList(eventData)
    }
  }

  private shouldRefreshList(eventName: string): boolean {
    return [
      EVENTS.VIDEO_CREATED,
      EVENTS.VIDEO_UPDATED,
      EVENTS.VIDEO_STATUS_READY
    ].includes(eventName)
  }

  private emitRefreshList(sourceEvent: EventData) {
    this.emit(EVENTS.REFRESH_LIST_VIEW, {
      source: sourceEvent.source,
      id: sourceEvent.id,
      metadata: {
        type: 'update',
        action: `refresh_list_${sourceEvent.metadata.action}`
      }
    })
  }

  public emitVideoCreated(id: string) {
    this.emit(EVENTS.VIDEO_CREATED, {
      id,
      source: 'webhook',
      metadata: {
        type: 'creation',
        action: 'video_created'
      }
    })
  }

  public emitVideoUpdated(id: string, isStatusChange: boolean = false) {
    this.emit(EVENTS.VIDEO_UPDATED, {
      id,
      source: 'webhook',
      metadata: {
        type: 'update',
        action: 'video_updated',
        isStatusChange
      }
    })

    if (isStatusChange) {
      this.emit(EVENTS.VIDEO_STATUS_READY, {
        id,
        source: 'webhook',
        metadata: {
          type: 'status',
          action: 'status_ready',
          status: 'ready'
        }
      })
    }
  }

  public emitUploadProgress(id: string, progress: number) {
    this.emit(EVENTS.VIDEO_UPLOAD_PROGRESS, {
      id,
      source: 'uploader',
      metadata: {
        type: 'upload',
        action: 'upload_progress',
        progress
      }
    })
  }

  public emitUploadError(id: string, error: string) {
    this.emit(EVENTS.VIDEO_UPLOAD_ERROR, {
      id,
      source: 'uploader',
      metadata: {
        type: 'error',
        action: 'upload_error',
        error
      }
    })
  }
}



