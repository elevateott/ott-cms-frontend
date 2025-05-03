// src/jobs/monitorDisconnectedStreams.ts
import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'

/**
 * Monitor disconnected streams and auto-disable them if they've been disconnected for too long
 * 
 * This job checks for live events that have been in the 'disconnected' state for longer than
 * their configured reconnect window (default 60 seconds) and automatically disables them.
 */
export async function monitorDisconnectedStreams(): Promise<void> {
  try {
    logger.info(
      { context: 'monitorDisconnectedStreams' },
      '🔍 Starting to check for disconnected streams that need to be auto-disabled'
    )

    // Get payload instance
    const payload = await getPayload({ config: configPromise })

    // Find all live events that are currently disconnected and have a disconnectedAt timestamp
    const disconnectedEvents = await payload.find({
      collection: 'live-events',
      where: {
        and: [
          {
            muxStatus: {
              equals: 'disconnected',
            },
          },
          {
            disconnectedAt: {
              not_equals: null,
            },
          },
        ],
      },
    })

    logger.info(
      { context: 'monitorDisconnectedStreams' },
      `🔍 Found ${disconnectedEvents.docs.length} disconnected live events`
    )

    // Process each disconnected event
    for (const liveEvent of disconnectedEvents.docs) {
      try {
        // Skip if no disconnectedAt timestamp
        if (!liveEvent.disconnectedAt) {
          continue
        }

        // Get the reconnect window from the live event (default to 60 seconds)
        const reconnectWindow = liveEvent.reconnectWindow || 60
        
        // Calculate how long the stream has been disconnected
        const disconnectedAt = new Date(liveEvent.disconnectedAt)
        const now = new Date()
        const disconnectedSeconds = Math.floor((now.getTime() - disconnectedAt.getTime()) / 1000)
        
        logger.info(
          { context: 'monitorDisconnectedStreams' },
          `🔍 Live event ${liveEvent.id} (${liveEvent.title}) has been disconnected for ${disconnectedSeconds} seconds (reconnect window: ${reconnectWindow} seconds)`
        )
        
        // If the stream has been disconnected for longer than the reconnect window, disable it
        if (disconnectedSeconds > reconnectWindow) {
          logger.info(
            { context: 'monitorDisconnectedStreams' },
            `🔍 Auto-disabling live event ${liveEvent.id} (${liveEvent.title}) after ${disconnectedSeconds} seconds of disconnection`
          )
          
          // Update the live event status to disabled
          await payload.update({
            collection: 'live-events',
            id: liveEvent.id,
            data: {
              muxStatus: 'disabled',
              // Keep the disconnectedAt timestamp for reference
            },
          })
          
          // Emit event to notify clients
          await eventService.emit(EVENTS.LIVE_STREAM_STATUS_UPDATED, {
            id: liveEvent.id,
            muxLiveStreamId: liveEvent.muxLiveStreamId,
            status: 'disabled',
            reason: 'auto-disabled',
            disconnectedSeconds,
            reconnectWindow,
            timestamp: Date.now(),
          })
          
          logger.info(
            { context: 'monitorDisconnectedStreams' },
            `✅ Successfully auto-disabled live event ${liveEvent.id}`
          )
        }
      } catch (error) {
        logger.error(
          { context: 'monitorDisconnectedStreams', error, liveEventId: liveEvent.id },
          `Error processing disconnected live event ${liveEvent.id}`
        )
      }
    }
    
    logger.info(
      { context: 'monitorDisconnectedStreams' },
      '✅ Completed checking for disconnected streams'
    )
  } catch (error) {
    logger.error(
      { context: 'monitorDisconnectedStreams', error },
      'Error monitoring disconnected streams'
    )
  }
}
