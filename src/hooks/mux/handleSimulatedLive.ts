// src/hooks/mux/handleSimulatedLive.ts
import { logger } from '@/utils/logger'
import type { CollectionBeforeChangeHook } from 'payload'
import { createSimulatedLive } from '@/services/mux/simulcastLiveService'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'

/**
 * Hook to handle simulated live events
 * 
 * This hook is called before a live event document is saved.
 * If the event is a simulated live event, it creates a Mux simulcast.
 */
export const handleSimulatedLive: CollectionBeforeChangeHook = async ({ 
  data, 
  operation, 
  originalDoc,
  req 
}) => {
  // Skip if not a simulated live event
  if (!data.isSimulatedLive) {
    return data
  }

  // Skip if using external HLS URL
  if (data.useExternalHlsUrl) {
    return data
  }

  try {
    // Check if we need to create or update a simulcast
    const shouldCreateSimulcast = (
      // Creating a new simulated live event
      (operation === 'create' && data.simulatedLiveAssetId && data.simulatedLiveStartTime) ||
      // Updating an existing event and changing relevant fields
      (operation === 'update' && (
        // Asset ID changed
        (data.simulatedLiveAssetId && data.simulatedLiveAssetId !== originalDoc?.simulatedLiveAssetId) ||
        // Start time changed
        (data.simulatedLiveStartTime && data.simulatedLiveStartTime !== originalDoc?.simulatedLiveStartTime) ||
        // Playback policy changed
        (data.playbackPolicy && data.playbackPolicy !== originalDoc?.playbackPolicy)
      ))
    )

    if (!shouldCreateSimulcast) {
      return data
    }

    // Get the recording asset ID
    let recordingAssetId = data.simulatedLiveAssetId

    // If it's a relationship to a recording, we need to fetch the Mux asset ID
    if (recordingAssetId && typeof recordingAssetId === 'string') {
      const recording = await req.payload.findByID({
        collection: 'recordings',
        id: recordingAssetId,
      })

      if (!recording || !recording.muxAssetId) {
        logger.error(
          { context: 'handleSimulatedLive' },
          `Recording ${recordingAssetId} not found or has no Mux asset ID`
        )
        throw new Error('Selected recording has no associated Mux asset')
      }

      recordingAssetId = recording.muxAssetId
    }

    // Validate required fields
    if (!recordingAssetId) {
      logger.error(
        { context: 'handleSimulatedLive' },
        'Missing recording asset ID for simulated live event'
      )
      throw new Error('Recording asset ID is required for simulated live events')
    }

    if (!data.simulatedLiveStartTime) {
      logger.error(
        { context: 'handleSimulatedLive' },
        'Missing start time for simulated live event'
      )
      throw new Error('Start time is required for simulated live events')
    }

    // Format the start time as ISO 8601
    const startTime = new Date(data.simulatedLiveStartTime).toISOString()

    // Determine playback policy
    const playbackPolicy = data.playbackPolicy === 'signed' ? 'signed' : 'public'

    logger.info(
      { context: 'handleSimulatedLive' },
      `Creating simulated live stream for asset ${recordingAssetId} starting at ${startTime}`
    )

    // Create the simulcast
    const { simulcastId, playbackId } = await createSimulatedLive({
      assetId: recordingAssetId,
      startTime,
      playbackPolicy,
    })

    // Update the data with the simulcast information
    data.simulatedLiveStreamId = simulcastId
    data.simulatedLivePlaybackId = playbackId

    // If this is a new event, set the status to 'scheduled'
    if (operation === 'create' && data.status === 'draft') {
      data.status = 'scheduled'
    }

    logger.info(
      { context: 'handleSimulatedLive' },
      `Successfully created simulated live stream with ID: ${simulcastId}`
    )

    // Emit an event for the frontend
    await eventService.emit(EVENTS.SIMULATED_LIVE_CREATED, {
      id: originalDoc?.id,
      simulcastId,
      playbackId,
      startTime,
      timestamp: Date.now(),
    })

    return data
  } catch (error) {
    logger.error(
      { context: 'handleSimulatedLive' },
      'Error creating simulated live stream:',
      error
    )
    throw new Error(
      `Failed to create simulated live stream: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
