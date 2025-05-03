// src/utilities/createNotification.ts
import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'

/**
 * Create a notification in the system
 * 
 * @param options Notification options
 * @returns Promise that resolves with the created notification
 */
export async function createNotification({
  title,
  message,
  type = 'info',
  relatedLiveEventId,
  emitEvent = true,
}: {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  relatedLiveEventId?: string
  emitEvent?: boolean
}): Promise<any> {
  try {
    // Get payload instance
    const payload = await getPayload({ config: configPromise })

    // Create notification document
    const notification = await payload.create({
      collection: 'notifications',
      data: {
        title,
        message,
        type,
        read: false,
        ...(relatedLiveEventId ? { relatedLiveEvent: relatedLiveEventId } : {}),
      },
    })

    logger.info(
      { context: 'createNotification' },
      `Created notification: ${title}`
    )

    // Emit event to notify clients
    if (emitEvent) {
      await eventService.emit(EVENTS.NOTIFICATION, {
        id: notification.id,
        title,
        message,
        type,
        relatedLiveEventId,
        timestamp: Date.now(),
      })

      logger.info(
        { context: 'createNotification' },
        `Emitted notification event for: ${title}`
      )
    }

    return notification
  } catch (error) {
    logger.error(
      { context: 'createNotification', error },
      'Failed to create notification'
    )
    throw error
  }
}
