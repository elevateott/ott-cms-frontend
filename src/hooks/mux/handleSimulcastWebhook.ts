// src/hooks/mux/handleSimulcastWebhook.ts
import { logger } from '@/utils/logger'
import { MuxWebhookEvent } from '@/types/mux'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Handle simulcast target webhook events from Mux
 */
export async function handleSimulcastWebhook(event: MuxWebhookEvent): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'simulcastWebhook' },
      `🔍 DEBUG [${timestamp}] Processing simulcast webhook event: ${event.type}`
    )

    // Extract data from the event
    const { type, data } = event
    const liveStreamId = data?.live_stream_id
    const simulcastTargetId = data?.id

    if (!liveStreamId || !simulcastTargetId) {
      logger.warn(
        { context: 'simulcastWebhook' },
        `🔍 DEBUG [${timestamp}] Missing live stream ID or simulcast target ID in webhook event`
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
        { context: 'simulcastWebhook' },
        `🔍 DEBUG [${timestamp}] No live event found for Mux live stream ID: ${liveStreamId}`
      )
      return
    }

    const liveEvent = liveEvents.docs[0]
    logger.info(
      { context: 'simulcastWebhook' },
      `🔍 DEBUG [${timestamp}] Found live event: ${liveEvent.id} (${liveEvent.title})`
    )

    // Determine the new status based on the event type
    let newStatus: 'connected' | 'disconnected' | 'error'
    switch (type) {
      case 'video.live_stream.simulcast_target.connected':
        newStatus = 'connected'
        break
      case 'video.live_stream.simulcast_target.disconnected':
        newStatus = 'disconnected'
        break
      case 'video.live_stream.simulcast_target.error':
        newStatus = 'error'
        break
      default:
        logger.warn(
          { context: 'simulcastWebhook' },
          `🔍 DEBUG [${timestamp}] Unhandled simulcast event type: ${type}`
        )
        return
    }

    // Update the simulcast target status in the live event
    const simulcastTargets = liveEvent.simulcastTargets || []
    const updatedTargets = simulcastTargets.map(target => {
      if (target.id === simulcastTargetId) {
        return {
          ...target,
          status: newStatus,
        }
      }
      return target
    })

    // Update the live event
    await payload.update({
      collection: 'live-events',
      id: liveEvent.id,
      data: {
        simulcastTargets: updatedTargets,
      },
    })

    logger.info(
      { context: 'simulcastWebhook' },
      `🔍 DEBUG [${timestamp}] Updated simulcast target ${simulcastTargetId} status to ${newStatus}`
    )

    // Emit event to notify clients
    await eventService.emit(EVENTS.LIVE_STREAM_SIMULCAST_UPDATED, {
      id: liveEvent.id,
      muxLiveStreamId: liveStreamId,
      simulcastTargetId,
      status: newStatus,
      timestamp: Date.now(),
    })

    logger.info(
      { context: 'simulcastWebhook' },
      `🔍 DEBUG [${timestamp}] Successfully processed simulcast webhook event`
    )
  } catch (error) {
    logger.error(
      { context: 'simulcastWebhook', error },
      'Failed to process simulcast webhook event'
    )
  }
}
