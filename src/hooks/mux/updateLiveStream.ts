import { logger } from '@/utils/logger'
import type { CollectionBeforeChangeHook } from 'payload'
import { createMuxService } from '@/services/mux'
import { updateSimulcastTargets } from '@/services/mux/simulcastService'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'
import { logError } from '@/utils/errorHandler'

/**
 * Hook to update a Mux live stream when a live event is updated
 *
 * This hook runs before a live event is updated and syncs changes with Mux.
 * It compares the previous document with the incoming data to determine what has changed.
 * Only fields that have changed are sent to Mux to minimize API calls.
 */
export const updateLiveStream: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  // Only proceed if this is an update operation and we have a Mux live stream ID
  if (operation !== 'update' || !originalDoc?.muxLiveStreamId) {
    return data
  }

  try {
    logger.info(
      { context: 'updateLiveStream' },
      `Checking for changes to Mux live stream ${originalDoc.muxLiveStreamId}`,
    )

    // Get Mux service
    const muxService = await createMuxService()

    // Track if any changes were made
    let muxChangesDetected = false

    // Prepare the update data for Mux
    const updateData: Record<string, any> = {}

    // Check for title changes
    if (data.title && data.title !== originalDoc.title) {
      logger.info(
        { context: 'updateLiveStream' },
        `Title changed from "${originalDoc.title}" to "${data.title}"`,
      )

      // Mux expects title in new_asset_settings
      if (!updateData.new_asset_settings) {
        updateData.new_asset_settings = {}
      }
      updateData.new_asset_settings.title = data.title
      muxChangesDetected = true
    }

    // Check for description changes
    if (data.description !== originalDoc.description) {
      logger.info(
        { context: 'updateLiveStream' },
        `Description changed from "${originalDoc.description}" to "${data.description}"`,
      )

      // Mux expects description in new_asset_settings
      if (!updateData.new_asset_settings) {
        updateData.new_asset_settings = {}
      }
      updateData.new_asset_settings.description = data.description
      muxChangesDetected = true
    }

    // Check for playback policy changes
    if (data.playbackPolicy && data.playbackPolicy !== originalDoc.playbackPolicy) {
      logger.info(
        { context: 'updateLiveStream' },
        `Playback policy changed from "${originalDoc.playbackPolicy}" to "${data.playbackPolicy}"`,
      )

      // Mux expects playback_policy as an array
      updateData.playback_policy = [data.playbackPolicy]

      // Also update new_asset_settings.playback_policy
      if (!updateData.new_asset_settings) {
        updateData.new_asset_settings = {}
      }
      updateData.new_asset_settings.playback_policy = [data.playbackPolicy]

      muxChangesDetected = true
    }

    // Check for recording setting changes
    if (
      data.isRecordingEnabled !== undefined &&
      data.isRecordingEnabled !== originalDoc.isRecordingEnabled
    ) {
      logger.info(
        { context: 'updateLiveStream' },
        `Recording setting changed from ${originalDoc.isRecordingEnabled} to ${data.isRecordingEnabled}`,
      )

      // Mux expects recording as an object with mode property
      updateData.recording = {
        mode: data.isRecordingEnabled ? 'automatic' : 'disabled',
      }
      muxChangesDetected = true
    }

    // Check for reconnect window changes
    if (
      data.reconnectWindow !== undefined &&
      data.reconnectWindow !== originalDoc.reconnectWindow
    ) {
      logger.info(
        { context: 'updateLiveStream' },
        `Reconnect window changed from ${originalDoc.reconnectWindow} to ${data.reconnectWindow}`,
      )

      updateData.reconnect_window = data.reconnectWindow
      muxChangesDetected = true
    }

    // Update the Mux live stream if changes were detected
    if (muxChangesDetected) {
      logger.info(
        { context: 'updateLiveStream' },
        `Updating Mux live stream ${originalDoc.muxLiveStreamId} with changes:`,
        updateData,
      )

      try {
        await muxService.updateLiveStream(originalDoc.muxLiveStreamId, updateData)

        logger.info(
          { context: 'updateLiveStream' },
          `Successfully updated Mux live stream ${originalDoc.muxLiveStreamId}`,
        )

        // Emit event to notify clients
        await eventService.emit(EVENTS.LIVE_STREAM_UPDATED, {
          id: originalDoc.id,
          muxLiveStreamId: originalDoc.muxLiveStreamId,
          changes: Object.keys(updateData),
          timestamp: Date.now(),
        })
      } catch (error) {
        // Log the error
        logError(error, 'updateLiveStream.updateLiveStream')

        // Throw an error to prevent the document from being saved
        throw new Error(
          `Failed to update Mux live stream: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    // Check for simulcast target changes
    if (
      data.simulcastTargets &&
      JSON.stringify(data.simulcastTargets) !== JSON.stringify(originalDoc.simulcastTargets)
    ) {
      logger.info(
        { context: 'updateLiveStream' },
        `Simulcast targets changed for live stream ${originalDoc.muxLiveStreamId}`,
      )

      try {
        // Update simulcast targets
        await updateSimulcastTargets(originalDoc.muxLiveStreamId, data.simulcastTargets)

        logger.info(
          { context: 'updateLiveStream' },
          `Successfully updated simulcast targets for live stream ${originalDoc.muxLiveStreamId}`,
        )

        // Emit event to notify clients
        await eventService.emit(EVENTS.LIVE_STREAM_UPDATED, {
          id: originalDoc.id,
          muxLiveStreamId: originalDoc.muxLiveStreamId,
          changes: ['simulcastTargets'],
          timestamp: Date.now(),
        })
      } catch (error) {
        // Log the error
        logError(error, 'updateLiveStream.updateSimulcastTargets')

        // Throw an error to prevent the document from being saved
        throw new Error(
          `Failed to update simulcast targets: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    // Return the data to continue with the update
    return data
  } catch (error) {
    // Log the error
    logError(error, 'updateLiveStream')

    // Throw an error to prevent the document from being saved
    throw new Error(
      `Failed to update Mux live stream: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
