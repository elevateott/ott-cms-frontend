// src/hooks/mux/createLiveStream.ts
import { logger } from '@/utils/logger'
import type { CollectionBeforeChangeHook } from 'payload'
import { createMuxService } from '@/services/mux'
import { getMuxSettings } from '@/utilities/getMuxSettings'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'

/**
 * Hook to create a Mux live stream when a new live event is created
 */
export const createLiveStream: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  // Only proceed if this is a create operation
  if (operation !== 'create') {
    return data
  }

  try {
    logger.info({ context: 'createLiveStream' }, 'Creating Mux live stream for new live event')

    // Get Mux service
    const muxService = await createMuxService()

    // Get Mux settings
    const muxSettings = await getMuxSettings()

    // Prepare simulcast targets if specified
    const simulcastTargets =
      data.simulcastTargets?.map((target: any) => ({
        url: target.url,
        stream_key: target.streamKey,
        name: target.name,
      })) || []

    // Determine playback policy
    const playbackPolicy = data.playbackPolicy === 'signed' ? ['signed'] : ['public']

    // Create the live stream
    const liveStreamData = await muxService.createLiveStream({
      playbackPolicy,
      newAssetSettings: {
        playbackPolicy,
        passthrough: `Recording of ${data.title}`,
      },
      reconnectWindow: data.reconnectWindow || 60,
      recording: {
        mode: data.isRecordingEnabled === true ? 'automatic' : 'disabled',
      },
      simulcastTargets: simulcastTargets.length > 0 ? simulcastTargets : undefined,
    })

    logger.info(
      { context: 'createLiveStream' },
      `Successfully created Mux live stream with ID: ${liveStreamData.id}`,
    )

    // Update the data with Mux live stream information
    const updatedData = {
      ...data,
      muxLiveStreamId: liveStreamData.id,
      muxStreamKey: liveStreamData.stream_key,
      muxPlaybackIds:
        liveStreamData.playback_ids?.map((idObj: any) => ({
          playbackId: idObj.id,
          policy: idObj.policy,
        })) || [],
      muxStatus: liveStreamData.status,
      muxCreatedAt: liveStreamData.created_at,
    }

    // If the stream is active, update the status
    if (liveStreamData.status === 'active' && data.status === 'draft') {
      updatedData.status = 'active'
    }

    // Emit event to notify clients
    try {
      await eventService.emit(EVENTS.LIVE_STREAM_CREATED, {
        id: liveStreamData.id,
        playbackIds: liveStreamData.playback_ids,
        status: liveStreamData.status,
        timestamp: Date.now(),
      })
    } catch (emitError) {
      logger.warn(
        { context: 'createLiveStream', error: emitError },
        'Failed to emit LIVE_STREAM_CREATED event',
      )
    }

    return updatedData
  } catch (error) {
    logger.error({ context: 'createLiveStream', error }, 'Failed to create Mux live stream')
    throw new Error(
      `Failed to create Mux live stream: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
