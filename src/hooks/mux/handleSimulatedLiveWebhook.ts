// src/hooks/mux/handleSimulatedLiveWebhook.ts
import { logger } from '@/utils/logger'
import { MuxWebhookEvent } from '@/types/mux'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'

/**
 * Handle Mux Simulcast webhook events for simulated live streams
 * 
 * This function processes webhook events related to simulated live streams.
 * 
 * @param event The webhook event from Mux
 */
export async function handleSimulatedLiveWebhook(event: MuxWebhookEvent): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    const simulcastId = event.data.id

    logger.info(
      { context: 'simulatedLiveWebhook' },
      `🔍 DEBUG [${timestamp}] Processing simulated live webhook for ${simulcastId}, type: ${event.type}`
    )

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Find the live event with this simulcast ID
    const liveEvents = await payload.find({
      collection: 'live-events',
      where: {
        simulatedLiveStreamId: {
          equals: simulcastId,
        },
      },
      limit: 1,
    })

    if (liveEvents.docs.length === 0) {
      logger.warn(
        { context: 'simulatedLiveWebhook' },
        `🔍 DEBUG [${timestamp}] No live event found for simulcast ${simulcastId}`
      )
      return
    }

    const liveEvent = liveEvents.docs[0]

    // Handle different event types
    switch (event.type) {
      case 'video.simulcast.started':
        logger.info(
          { context: 'simulatedLiveWebhook' },
          `🔍 DEBUG [${timestamp}] Simulcast ${simulcastId} started`
        )

        // Update the live event status
        await payload.update({
          collection: 'live-events',
          id: liveEvent.id,
          data: {
            status: 'active',
            startedAt: new Date().toISOString(),
          },
        })

        // Emit event
        await eventService.emit(EVENTS.SIMULATED_LIVE_STARTED, {
          id: liveEvent.id,
          simulcastId,
          playbackId: liveEvent.simulatedLivePlaybackId,
          playbackUrl: `https://stream.mux.com/${liveEvent.simulatedLivePlaybackId}.m3u8`,
          timestamp: Date.now(),
        })
        break

      case 'video.simulcast.completed':
        logger.info(
          { context: 'simulatedLiveWebhook' },
          `🔍 DEBUG [${timestamp}] Simulcast ${simulcastId} completed`
        )

        // Update the live event status
        await payload.update({
          collection: 'live-events',
          id: liveEvent.id,
          data: {
            status: 'completed',
            endedAt: new Date().toISOString(),
          },
        })

        // Emit event
        await eventService.emit(EVENTS.SIMULATED_LIVE_ENDED, {
          id: liveEvent.id,
          simulcastId,
          timestamp: Date.now(),
        })
        break

      default:
        logger.info(
          { context: 'simulatedLiveWebhook' },
          `🔍 DEBUG [${timestamp}] Unhandled simulcast event type: ${event.type}`
        )
    }
  } catch (error) {
    logger.error(
      { context: 'simulatedLiveWebhook' },
      'Error processing simulated live webhook:',
      error
    )
  }
}
