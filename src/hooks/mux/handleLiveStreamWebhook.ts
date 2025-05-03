// src/hooks/mux/handleLiveStreamWebhook.ts
import { logger } from '@/utils/logger'
import { MuxWebhookEvent } from '@/types/mux'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createNotification } from '@/utilities/createNotification'
import { sendNotificationEmail } from '@/utilities/sendNotificationEmail'

/**
 * Handle Mux live stream webhook events
 * @param event The webhook event from Mux
 */
export async function handleLiveStreamWebhook(event: MuxWebhookEvent): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Processing live stream webhook event: ${event.type}`,
    )

    // Get the live stream ID from the event
    const liveStreamId = event.data?.id

    if (!liveStreamId) {
      logger.warn(
        { context: 'liveStreamWebhook' },
        `🔍 DEBUG [${timestamp}] Missing live stream ID in webhook event`,
      )
      return
    }

    // Get payload instance
    const payload = await getPayload({ config: configPromise })

    // Find the live event document that matches this Mux live stream ID
    const liveEvents = await payload.find({
      collection: 'live-events',
      where: {
        muxLiveStreamId: {
          equals: liveStreamId,
        },
      },
    })

    if (!liveEvents.docs || liveEvents.docs.length === 0) {
      logger.warn(
        { context: 'liveStreamWebhook' },
        `🔍 DEBUG [${timestamp}] No live event found for Mux live stream ID: ${liveStreamId}`,
      )
      return
    }

    const liveEvent = liveEvents.docs[0]
    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Found live event: ${liveEvent.id} (${liveEvent.title})`,
    )

    // Handle different event types
    switch (event.type) {
      case 'video.live_stream.idle':
        await handleLiveStreamIdle(payload, liveEvent, event)
        break
      case 'video.live_stream.active':
        await handleLiveStreamActive(payload, liveEvent, event)
        break
      case 'video.live_stream.disconnected':
        await handleLiveStreamDisconnected(payload, liveEvent, event)
        break
      case 'video.live_stream.recording':
        await handleLiveStreamRecording(payload, liveEvent, event)
        break
      case 'video.live_stream.connected':
        await handleLiveStreamConnected(payload, liveEvent, event)
        break
      default:
        logger.info(
          { context: 'liveStreamWebhook' },
          `🔍 DEBUG [${timestamp}] Unhandled live stream event type: ${event.type}`,
        )
    }
  } catch (error) {
    logger.error(
      { context: 'liveStreamWebhook', error },
      'Error handling live stream webhook event',
    )
  }
}

/**
 * Handle live stream idle event
 */
async function handleLiveStreamIdle(
  payload: any,
  liveEvent: any,
  event: MuxWebhookEvent,
): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Handling live stream idle event for ${liveEvent.id}`,
    )

    // Update the live event with the idle status
    await payload.update({
      collection: 'live-events',
      id: liveEvent.id,
      data: {
        muxStatus: 'idle',
      },
    })

    // Emit event to notify clients
    await eventService.emit(EVENTS.LIVE_STREAM_IDLE, {
      id: liveEvent.id,
      muxLiveStreamId: event.data?.id,
      status: 'idle',
      timestamp: Date.now(),
    })

    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Successfully updated live event ${liveEvent.id} to idle status`,
    )
  } catch (error) {
    logger.error({ context: 'liveStreamWebhook', error }, 'Error handling live stream idle event')
  }
}

/**
 * Handle live stream active event
 */
async function handleLiveStreamActive(
  payload: any,
  liveEvent: any,
  event: MuxWebhookEvent,
): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Handling live stream active event for ${liveEvent.id}`,
    )

    // Update the live event with the active status and clear disconnectedAt
    await payload.update({
      collection: 'live-events',
      id: liveEvent.id,
      data: {
        muxStatus: 'active',
        status: 'active', // Also update the document status
        disconnectedAt: null, // Clear the disconnection timestamp when stream recovers
      },
    })

    // Emit event to notify clients
    await eventService.emit(EVENTS.LIVE_STREAM_ACTIVE, {
      id: liveEvent.id,
      muxLiveStreamId: event.data?.id,
      status: 'active',
      timestamp: Date.now(),
    })

    // Create notification
    await createNotification({
      title: 'Stream is Live!',
      message: `Live event "${liveEvent.title}" is now active and broadcasting.`,
      type: 'success',
      relatedLiveEventId: liveEvent.id,
    })

    // Get email settings to check if we should send email notifications
    const emailSettings = await payload.findGlobal({
      slug: 'email-settings',
    })

    // Send email notification if enabled
    if (emailSettings?.notifyOnStreamActive) {
      await sendNotificationEmail({
        subject: `🔴 LIVE: ${liveEvent.title}`,
        message: `
          <p>Your live event <strong>${liveEvent.title}</strong> is now active and broadcasting.</p>
          <p>Stream started at: ${new Date().toLocaleString()}</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/live-events/${liveEvent.id}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
              View in Admin Dashboard
            </a>
          </p>
        `,
      })
    }

    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Successfully updated live event ${liveEvent.id} to active status`,
    )
  } catch (error) {
    logger.error({ context: 'liveStreamWebhook', error }, 'Error handling live stream active event')
  }
}

/**
 * Handle live stream disconnected event
 */
async function handleLiveStreamDisconnected(
  payload: any,
  liveEvent: any,
  event: MuxWebhookEvent,
): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Handling live stream disconnected event for ${liveEvent.id}`,
    )

    // Update the live event with the disconnected status and timestamp
    await payload.update({
      collection: 'live-events',
      id: liveEvent.id,
      data: {
        muxStatus: 'disconnected',
        disconnectedAt: new Date().toISOString(),
      },
    })

    // Emit event to notify clients
    await eventService.emit(EVENTS.LIVE_STREAM_DISCONNECTED, {
      id: liveEvent.id,
      muxLiveStreamId: event.data?.id,
      status: 'disconnected',
      timestamp: Date.now(),
    })

    // Create notification
    await createNotification({
      title: 'Stream Disconnected',
      message: `Live event "${liveEvent.title}" has disconnected. Attempting to reconnect...`,
      type: 'warning',
      relatedLiveEventId: liveEvent.id,
    })

    // Get email settings to check if we should send email notifications
    const emailSettings = await payload.findGlobal({
      slug: 'email-settings',
    })

    // Send email notification if enabled
    if (emailSettings?.notifyOnStreamDisconnected) {
      // Get the reconnect window from the live event (default to 60 seconds)
      const reconnectWindow = liveEvent.reconnectWindow || 60

      await sendNotificationEmail({
        subject: `⚠️ Stream Disconnected: ${liveEvent.title}`,
        message: `
          <p>Your live event <strong>${liveEvent.title}</strong> has disconnected.</p>
          <p>The system will attempt to reconnect for the next ${reconnectWindow} seconds.</p>
          <p>Disconnected at: ${new Date().toLocaleString()}</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/live-events/${liveEvent.id}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">
              View in Admin Dashboard
            </a>
          </p>
          <p>If the stream doesn't reconnect within the reconnect window, it will be automatically disabled.</p>
        `,
      })
    }

    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Successfully updated live event ${liveEvent.id} to disconnected status`,
    )
  } catch (error) {
    logger.error(
      { context: 'liveStreamWebhook', error },
      'Error handling live stream disconnected event',
    )
  }
}

/**
 * Handle live stream recording event
 */
async function handleLiveStreamRecording(
  payload: any,
  liveEvent: any,
  event: MuxWebhookEvent,
): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Handling live stream recording event for ${liveEvent.id}`,
    )

    // Get the recording asset ID from the event
    const recordingAssetId = event.data?.active_asset_id

    if (!recordingAssetId) {
      logger.warn(
        { context: 'liveStreamWebhook' },
        `🔍 DEBUG [${timestamp}] Missing recording asset ID in recording event`,
      )
      return
    }

    // Update the live event with the recording asset ID
    await payload.update({
      collection: 'live-events',
      id: liveEvent.id,
      data: {
        recordingAssetId,
      },
    })

    // Emit event to notify clients
    await eventService.emit(EVENTS.LIVE_STREAM_RECORDING, {
      id: liveEvent.id,
      muxLiveStreamId: event.data?.id,
      recordingAssetId,
      timestamp: Date.now(),
    })

    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Successfully updated live event ${liveEvent.id} with recording asset ID: ${recordingAssetId}`,
    )
  } catch (error) {
    logger.error(
      { context: 'liveStreamWebhook', error },
      'Error handling live stream recording event',
    )
  }
}

/**
 * Handle live stream connected event
 */
async function handleLiveStreamConnected(
  payload: any,
  liveEvent: any,
  event: MuxWebhookEvent,
): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Handling live stream connected event for ${liveEvent.id}`,
    )

    // Emit event to notify clients
    await eventService.emit(EVENTS.LIVE_STREAM_STATUS_UPDATED, {
      id: liveEvent.id,
      muxLiveStreamId: event.data?.id,
      status: 'connected',
      timestamp: Date.now(),
    })

    logger.info(
      { context: 'liveStreamWebhook' },
      `🔍 DEBUG [${timestamp}] Successfully processed connected event for live event ${liveEvent.id}`,
    )
  } catch (error) {
    logger.error(
      { context: 'liveStreamWebhook', error },
      'Error handling live stream connected event',
    )
  }
}
