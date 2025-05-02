// src/hooks/mux/handleRecordingWebhook.ts
import { logger } from '@/utils/logger'
import { MuxWebhookEvent } from '@/types/mux'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Handle recording-related webhook events from Mux
 */
export async function handleRecordingWebhook(event: MuxWebhookEvent): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Processing recording webhook event: ${event.type}`
    )

    // Extract data from the event
    const { type, data } = event
    
    // Check if this is a recording asset
    const liveStreamId = data?.live_stream_id
    
    if (!liveStreamId) {
      logger.info(
        { context: 'recordingWebhook' },
        `🔍 DEBUG [${timestamp}] Not a recording asset (no live_stream_id), skipping`
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
        { context: 'recordingWebhook' },
        `🔍 DEBUG [${timestamp}] No live event found for Mux live stream ID: ${liveStreamId}`
      )
      return
    }

    const liveEvent = liveEvents.docs[0]
    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Found live event: ${liveEvent.id} (${liveEvent.title})`
    )

    // Handle asset.created event (recording is ready)
    if (type === 'video.asset.created') {
      await handleAssetCreated(payload, liveEvent, data)
    }
    // Handle asset.ready event (recording is ready for playback)
    else if (type === 'video.asset.ready') {
      await handleAssetReady(payload, liveEvent, data)
    }
  } catch (error) {
    logger.error(
      { context: 'recordingWebhook', error },
      'Failed to process recording webhook event'
    )
  }
}

/**
 * Handle asset.created event for recordings
 */
async function handleAssetCreated(payload: any, liveEvent: any, data: any): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Handling asset.created event for live event ${liveEvent.id}`
    )

    // Extract asset data
    const assetId = data.id
    const playbackIds = data.playback_ids || []
    const playbackId = playbackIds[0]?.id
    
    if (!playbackId) {
      logger.warn(
        { context: 'recordingWebhook' },
        `🔍 DEBUG [${timestamp}] No playback ID found in asset.created event`
      )
      return
    }

    // Update the live event with the recording asset ID
    await payload.update({
      collection: 'live-events',
      id: liveEvent.id,
      data: {
        recordingAssetId: assetId,
      },
    })

    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Updated live event ${liveEvent.id} with recording asset ID: ${assetId}`
    )

    // Create a new recording document
    const recordingTitle = `Recording of ${liveEvent.title}`
    const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`
    const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`
    
    // Create the recording
    const recording = await payload.create({
      collection: 'recordings',
      data: {
        title: recordingTitle,
        description: `Recording of live event "${liveEvent.title}" from ${new Date().toLocaleDateString()}`,
        liveEvent: liveEvent.id,
        playbackUrl,
        thumbnailUrl,
        muxAssetId: assetId,
        muxPlaybackId: playbackId,
        playbackPolicy: liveEvent.playbackPolicy || 'public',
      },
    })

    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Created recording document: ${recording.id}`
    )

    // Update the live event with the recording relationship
    const existingRecordings = liveEvent.recordings || []
    await payload.update({
      collection: 'live-events',
      id: liveEvent.id,
      data: {
        recordings: [...existingRecordings, recording.id],
      },
    })

    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Updated live event ${liveEvent.id} with recording relationship`
    )

    // Emit event
    await eventService.emit(EVENTS.RECORDING_CREATED, {
      liveEventId: liveEvent.id,
      recordingId: recording.id,
      assetId,
      playbackId,
      timestamp: Date.now(),
    })
  } catch (error) {
    logger.error(
      { context: 'recordingWebhook', error },
      'Failed to handle asset.created event'
    )
  }
}

/**
 * Handle asset.ready event for recordings
 */
async function handleAssetReady(payload: any, liveEvent: any, data: any): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Handling asset.ready event for live event ${liveEvent.id}`
    )

    // Extract asset data
    const assetId = data.id
    const duration = data.duration
    const aspectRatio = data.aspect_ratio
    
    // Find the recording document
    const recordings = await payload.find({
      collection: 'recordings',
      where: {
        muxAssetId: {
          equals: assetId,
        },
      },
    })

    if (!recordings.docs || recordings.docs.length === 0) {
      logger.warn(
        { context: 'recordingWebhook' },
        `🔍 DEBUG [${timestamp}] No recording found for asset ID: ${assetId}`
      )
      return
    }

    const recording = recordings.docs[0]
    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Found recording: ${recording.id}`
    )

    // Update the recording with additional metadata
    await payload.update({
      collection: 'recordings',
      id: recording.id,
      data: {
        duration,
        aspectRatio,
      },
    })

    logger.info(
      { context: 'recordingWebhook' },
      `🔍 DEBUG [${timestamp}] Updated recording ${recording.id} with duration and aspect ratio`
    )

    // Emit event
    await eventService.emit(EVENTS.RECORDING_READY, {
      liveEventId: liveEvent.id,
      recordingId: recording.id,
      assetId,
      duration,
      timestamp: Date.now(),
    })
  } catch (error) {
    logger.error(
      { context: 'recordingWebhook', error },
      'Failed to handle asset.ready event'
    )
  }
}
