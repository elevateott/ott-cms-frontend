/**
 * Webhook Handler Service
 *
 * Handles processing of Mux webhook events
 */

import { VideoRepository } from '@/repositories/videoRepository'
import { IMuxService } from '@/services/mux/IMuxService'
import { MuxWebhookEvent, MuxWebhookEventType } from '@/types/mux'
import { logError } from '@/utils/errorHandler'
import { EVENTS, MUX_WEBHOOK_EVENT_TYPES } from '@/constants'
import { EventService } from '../events/EventService'

// Define all event constants
const EVENTS = {
  VIDEO_UPDATED: 'video_updated',
  VIDEO_STATUS_READY: 'video_status_ready',
  VIDEO_CREATED: 'video_created'
} as const;

export class WebhookHandlerService {
  private videoRepository: VideoRepository
  private muxService: IMuxService
  private eventEmitter: (eventName: string, data: any) => void
  private eventService: EventService

  constructor(
    videoRepository: VideoRepository,
    muxService: IMuxService,
    eventEmitter: (eventName: string, data: any) => void
  ) {
    this.videoRepository = videoRepository
    this.muxService = muxService
    this.eventEmitter = eventEmitter
    this.eventService = EventService.getInstance(eventEmitter)
  }

  private getThumbnailUrl(playbackId: string): string {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=preserve`
  }

  /**
   * Handle a webhook event
   */
  public async handleEvent(event: any): Promise<void> {
    try {
      const { type, data } = event;
      console.log(`🔔 WEBHOOK [${new Date().toISOString()}] Received webhook event: ${type}`);

      switch (type) {
        case MUX_WEBHOOK_EVENT_TYPES.ASSET_CREATED:
          await this.handleAssetCreated(data);
          break;

        case MUX_WEBHOOK_EVENT_TYPES.ASSET_READY:
          await this.handleAssetReady(data);
          break;

        case MUX_WEBHOOK_EVENT_TYPES.UPLOAD_ASSET_CREATED:
          await this.handleUploadAssetCreated(data);
          break;

        case MUX_WEBHOOK_EVENT_TYPES.NON_STANDARD_INPUT_DETECTED:
          await this.handleNonStandardInput(data);
          break;

        default:
          console.log(`Unhandled webhook event type: ${type}`);
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleEvent');
    }
  }

  /**
   * Handle asset.created event
   */
  private async handleAssetCreated(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      console.log(`🔔 WEBHOOK [${timestamp}] Processing asset.created event`)

      const { id: assetId, playback_ids, upload_id } = data

      console.log(`🔔 WEBHOOK [${timestamp}] Asset ID: ${assetId}`)
      console.log(`🔔 WEBHOOK [${timestamp}] Upload ID: ${upload_id || 'N/A'}`)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Playback IDs:`,
        JSON.stringify(playback_ids || [], null, 2),
      )

      // If we have an upload_id, try to find an existing video
      if (upload_id) {
        console.log(
          `🔔 WEBHOOK [${timestamp}] Looking for existing video with upload ID: ${upload_id}`,
        )
        const existingVideo = await this.videoRepository.findByMuxUploadId(upload_id)
        console.log(
          `🔔 WEBHOOK [${timestamp}] Existing video found: ${existingVideo ? 'Yes' : 'No'}`,
        )
        if (existingVideo) {
          console.log(`🔔 WEBHOOK [${timestamp}] Existing video ID: ${existingVideo.id}`)
          console.log(
            `🔔 WEBHOOK [${timestamp}] Existing video title: ${existingVideo.title || 'N/A'}`,
          )
          console.log(
            `🔔 WEBHOOK [${timestamp}] Existing video status: ${existingVideo.muxData?.status || 'N/A'}`,
          )
        }

        if (existingVideo) {
          const thumbnailUrl = playback_ids?.[0]?.id
            ? this.getThumbnailUrl(playback_ids[0].id)
            : undefined

          console.log(`🔔 WEBHOOK [${timestamp}] Updating existing video with asset ID: ${assetId}`)
          console.log(`🔔 WEBHOOK [${timestamp}] Updating video ID: ${existingVideo.id}`)
          console.log(
            `🔔 WEBHOOK [${timestamp}] Setting playback ID: ${playback_ids?.[0]?.id || 'N/A'}`,
          )
          console.log(`🔔 WEBHOOK [${timestamp}] Setting status: processing`)
          console.log(`🔔 WEBHOOK [${timestamp}] Setting thumbnail URL: ${thumbnailUrl || 'N/A'}`)

          // Update the existing video with the asset ID
          const updatedVideo = await this.videoRepository.update(existingVideo.id, {
            muxData: {
              ...existingVideo.muxData,
              assetId,
              playbackId: playback_ids?.[0]?.id,
              status: 'processing',
            },
            muxThumbnailUrl: thumbnailUrl,
          })

          console.log(
            `🔔 WEBHOOK [${timestamp}] Video update result: ${updatedVideo ? 'Success' : 'Failed'}`,
          )

          if (updatedVideo) {
            this.emitVideoUpdated(updatedVideo.id)
          }
          return
        }
      }

      // If no existing video found, create a new one
      console.log(`🔔 WEBHOOK [${timestamp}] No existing video found, creating a new one`)

      const thumbnailUrl = playback_ids?.[0]?.id
        ? this.getThumbnailUrl(playback_ids[0].id)
        : undefined

      console.log(`🔔 WEBHOOK [${timestamp}] Creating new video with asset ID: ${assetId}`)
      console.log(`🔔 WEBHOOK [${timestamp}] Setting title: Untitled Video ${assetId}`)
      console.log(`🔔 WEBHOOK [${timestamp}] Setting source type: mux`)
      console.log(`🔔 WEBHOOK [${timestamp}] Setting upload ID: ${upload_id || 'N/A'}`)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Setting playback ID: ${playback_ids?.[0]?.id || 'N/A'}`,
      )
      console.log(`🔔 WEBHOOK [${timestamp}] Setting status: processing`)
      console.log(`🔔 WEBHOOK [${timestamp}] Setting thumbnail URL: ${thumbnailUrl || 'N/A'}`)

      const newVideo = await this.videoRepository.create({
        title: `Untitled Video ${assetId}`,
        sourceType: 'mux',
        muxData: {
          assetId,
          uploadId: upload_id,
          playbackId: playback_ids?.[0]?.id,
          status: 'processing',
        },
        muxThumbnailUrl: thumbnailUrl,
        publishedAt: new Date().toISOString(),
      })

      console.log(
        `🔔 WEBHOOK [${timestamp}] Video creation result: ${newVideo ? 'Success' : 'Failed'}`,
      )
      if (newVideo) {
        console.log(`🔔 WEBHOOK [${timestamp}] New video ID: ${newVideo.id}`)
      }

      if (newVideo) {
        this.emitVideoCreated(newVideo.id)
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleAssetCreated')
    }
  }

  /**
   * Handle asset.ready event
   */
  private async handleAssetReady(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      console.log(`🔔 WEBHOOK [${timestamp}] Processing asset.ready event`)

      const { id: assetId } = data
      console.log(`🔔 WEBHOOK [${timestamp}] Asset ID: ${assetId}`)

      // Extract useful metadata from the asset data
      const { duration, aspect_ratio: aspectRatio, playback_ids: playbackIds } = data
      const playbackId = playbackIds?.[0]?.id

      console.log(`🔔 WEBHOOK [${timestamp}] Asset metadata:`, {
        duration: duration || 'N/A',
        aspectRatio: aspectRatio || 'N/A',
        playbackId: playbackId || 'N/A',
      })

      // Find video with this assetId
      console.log(`🔔 WEBHOOK [${timestamp}] Looking for video with asset ID: ${assetId}`)
      const video = await this.videoRepository.findByMuxAssetId(assetId)
      console.log(`🔔 WEBHOOK [${timestamp}] Video found: ${video ? 'Yes' : 'No'}`)

      if (!video) {
        console.log(`No video found for assetId ${assetId}`)
        return
      }

      console.log(
        `Found video ${video.id} for assetId ${assetId}, current status: ${video.muxData?.status}`,
      )

      // Only update if status is not already 'ready'
      if (video.muxData?.status === 'ready') {
        console.log(`Video ${video.id} is already in ready state, skipping update`)
        return
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Updating video ${video.id} status to ready`)

      // Prepare update data with all available metadata
      const updateData: any = {}

      // Add metadata fields if they're available and not already set
      if (duration && !video.duration) {
        updateData.duration = duration
        console.log(`🔔 WEBHOOK [${timestamp}] Setting duration: ${duration}`)
      }

      if (aspectRatio && !video.aspectRatio) {
        updateData.aspectRatio = aspectRatio
        console.log(`🔔 WEBHOOK [${timestamp}] Setting aspect ratio: ${aspectRatio}`)
      }

      // Always update muxData
      updateData.muxData = {
        ...video.muxData,
        status: 'ready',
      }
      console.log(`🔔 WEBHOOK [${timestamp}] Setting status: ready`)

      // Add playbackId if available and not already set
      if (playbackId && !video.muxData?.playbackId) {
        updateData.muxData.playbackId = playbackId
        console.log(`🔔 WEBHOOK [${timestamp}] Setting playback ID: ${playbackId}`)
      }

      // Update thumbnail URL if we have a playback ID
      if (playbackId && !video.muxThumbnailUrl) {
        const thumbnailUrl = this.getThumbnailUrl(playbackId)
        updateData.muxThumbnailUrl = thumbnailUrl
        console.log(`🔔 WEBHOOK [${timestamp}] Setting thumbnail URL: ${thumbnailUrl}`)
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Update data:`, JSON.stringify(updateData, null, 2))

      // Update the video with the asset data
      console.log(`🔔 WEBHOOK [${timestamp}] Updating video in database...`)
      const updatedVideo = await this.videoRepository.update(video.id, updateData)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Video update result: ${updatedVideo ? 'Success' : 'Failed'}`,
      )

      if (updatedVideo) {
        console.log(
          `Successfully updated video ${video.id} status to ready with metadata:`,
          updateData,
        )
        console.log(`Emitting video_updated event for video ${video.id}`)

        // Add a special flag to indicate that this is a status change to ready
        this.emitVideoUpdated(updatedVideo.id, true)
      } else {
        console.error(`Failed to update video ${video.id} status to ready`)
      }
    } catch (error) {
      console.error('Error handling asset.ready event:', error)
    }
  }

  /**
   * Handle upload.asset_created event
   */
  private async handleUploadAssetCreated(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      console.log(`🔔 WEBHOOK [${timestamp}] Processing upload.asset_created event`)

      const { id: uploadId, asset_id: assetId } = data

      console.log(`🔔 WEBHOOK [${timestamp}] Upload ID: ${uploadId}`)
      console.log(`🔔 WEBHOOK [${timestamp}] Asset ID: ${assetId || 'N/A'}`)

      // Find video with this uploadId
      console.log(`🔔 WEBHOOK [${timestamp}] Looking for video with upload ID: ${uploadId}`)
      const video = await this.videoRepository.findByMuxUploadId(uploadId)
      console.log(`🔔 WEBHOOK [${timestamp}] Video found: ${video ? 'Yes' : 'No'}`)

      if (!video) {
        console.log(
          `🔔 WEBHOOK [${timestamp}] No video found for uploadId ${uploadId}, skipping update`,
        )
        return
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Found video ID: ${video.id}`)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Current video status: ${video.muxData?.status || 'N/A'}`,
      )

      // Prepare update data
      const updateStatus = video.muxData?.status !== 'ready'
      console.log(`🔔 WEBHOOK [${timestamp}] Will update status: ${updateStatus ? 'Yes' : 'No'}`)

      const updateData: any = {
        muxData: {
          ...video.muxData,
          assetId,
          // Only update the status if it's not already 'ready'
          ...(updateStatus ? { status: 'processing' } : {}),
        },
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Setting asset ID: ${assetId}`)
      console.log(`🔔 WEBHOOK [${timestamp}] Update data:`, JSON.stringify(updateData, null, 2))

      // Update the video with the asset data
      console.log(`🔔 WEBHOOK [${timestamp}] Updating video in database...`)
      const updatedVideo = await this.videoRepository.update(video.id, updateData)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Video update result: ${updatedVideo ? 'Success' : 'Failed'}`,
      )

      if (updatedVideo) {
        console.log(`Updated video ${video.id} with Mux asset ID`)
        this.emitVideoUpdated(video.id)
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleUploadAssetCreated')
    }
  }

  /**
   * Handle non-standard input detected event
   */
  private async handleNonStandardInput(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      console.log(`🔔 WEBHOOK [${timestamp}] Processing non-standard input detected event`)

      const { upload_id, video_quality, tracks } = data

      console.log(`🔔 WEBHOOK [${timestamp}] Upload ID: ${upload_id || 'N/A'}`)
      console.log(`🔔 WEBHOOK [${timestamp}] Video Quality: ${video_quality || 'N/A'}`)
      console.log(`🔔 WEBHOOK [${timestamp}] Tracks:`, JSON.stringify(tracks || [], null, 2))

      // Find the video with this upload ID
      console.log(`🔔 WEBHOOK [${timestamp}] Looking for video with upload ID: ${upload_id}`)
      const video = await this.videoRepository.findByMuxUploadId(upload_id)
      console.log(`🔔 WEBHOOK [${timestamp}] Video found: ${video ? 'Yes' : 'No'}`)

      if (!video) {
        console.log(
          `🔔 WEBHOOK [${timestamp}] No video found for uploadId ${upload_id}, skipping update`,
        )
        return
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Found video ID: ${video.id}`)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Current video status: ${video.muxData?.status || 'N/A'}`,
      )

      // Update the video with the non-standard input information
      // Create a custom update object to avoid type issues
      const muxDataUpdate: any = {
        ...video.muxData,
        nonStandardInput: true,
      }
      console.log(`🔔 WEBHOOK [${timestamp}] Setting nonStandardInput: true`)

      // Add video quality if available
      if (video_quality) {
        muxDataUpdate.videoQuality = video_quality
        console.log(`🔔 WEBHOOK [${timestamp}] Setting videoQuality: ${video_quality}`)
      }

      // Add tracks if available
      if (tracks) {
        muxDataUpdate.tracks = tracks
        console.log(`🔔 WEBHOOK [${timestamp}] Setting tracks:`, JSON.stringify(tracks, null, 2))
      }

      const updateData = {
        muxData: muxDataUpdate,
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Update data:`, JSON.stringify(updateData, null, 2))

      // Update the video with the non-standard input information
      console.log(`🔔 WEBHOOK [${timestamp}] Updating video in database...`)
      const updatedVideo = await this.videoRepository.update(video.id, updateData)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Video update result: ${updatedVideo ? 'Success' : 'Failed'}`,
      )

      if (updatedVideo) {
        console.log(`Updated video ${video.id} with non-standard input information`)
        this.emitVideoUpdated(video.id)
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleNonStandardInput')
    }
  }

  /**
   * Emit video created event
   */
  private emitVideoCreated(id: string): void {
    try {
      const timestamp = Date.now()
      console.log(`🔔 WEBHOOK [${new Date(timestamp).toISOString()}] Emitting video_created event for video ${id}`)

      // Emit standardized video created event
      this.eventEmitter(EVENTS.VIDEO_CREATED, {
        id,
        source: 'webhook',
        timestamp,
        metadata: {
          type: 'creation',
          action: 'video_created'
        }
      })
    } catch (error) {
      logError(error, 'WebhookHandlerService.emitVideoCreated')
    }
  }

  /**
   * Emit video updated event
   * @param id The video ID
   * @param isStatusChange Whether this is a status change to ready
   */
  private emitVideoUpdated(id: string, isStatusChange: boolean = false): void {
    try {
      const timestamp = Date.now()
      const eventData = {
        id,
        source: 'webhook',
        timestamp,
        metadata: {
          type: 'update',
          isStatusChange,
          action: isStatusChange ? 'status_ready' : 'video_updated'
        }
      }

      console.log('🔔 WebhookHandler: Emitting video updated event:', {
        event: EVENTS.VIDEO_UPDATED,
        data: eventData
      })

      this.eventEmitter(EVENTS.VIDEO_UPDATED, eventData)

      if (isStatusChange) {
        console.log('🔔 WebhookHandler: Emitting status ready event:', {
          event: EVENTS.VIDEO_STATUS_READY,
          data: eventData
        })

        this.eventEmitter(EVENTS.VIDEO_STATUS_READY, {
          ...eventData,
          metadata: {
            ...eventData.metadata,
            status: 'ready'
          }
        })
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.emitVideoUpdated')
    }
  }
}







