/**
 * Webhook Handler Service
 *
 * Handles processing of Mux webhook events
 */

import { VideoRepository } from '@/repositories/videoRepository'
import { IMuxService } from '@/services/mux/IMuxService'
import { MuxWebhookEvent, MuxWebhookEventType } from '@/types/mux'
import { logError } from '@/utils/errorHandler'
import { MUX_WEBHOOK_EVENT_TYPES } from '@/constants'

export class WebhookHandlerService {
  private videoRepository: VideoRepository
  private muxService: IMuxService
  private eventEmitter: (event: string, data: any) => void

  constructor(
    videoRepository: VideoRepository,
    muxService: IMuxService,
    eventEmitter: (event: string, data: any) => void,
  ) {
    this.videoRepository = videoRepository
    this.muxService = muxService
    this.eventEmitter = eventEmitter
  }

  private getThumbnailUrl(playbackId: string): string {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=preserve`
  }

  /**
   * Handle a webhook event
   */
  async handleEvent(event: MuxWebhookEvent): Promise<void> {
    try {
      const { type, data } = event

      console.log(`Processing webhook event: ${type}`)

      switch (type) {
        case MUX_WEBHOOK_EVENT_TYPES.ASSET_CREATED:
          await this.handleAssetCreated(data)
          break

        case MUX_WEBHOOK_EVENT_TYPES.ASSET_READY:
          await this.handleAssetReady(data)
          break

        case MUX_WEBHOOK_EVENT_TYPES.UPLOAD_ASSET_CREATED:
          await this.handleUploadAssetCreated(data)
          break

        case MUX_WEBHOOK_EVENT_TYPES.NON_STANDARD_INPUT_DETECTED:
          await this.handleNonStandardInput(data)
          break

        default:
          console.log(`Unhandled webhook event type: ${type}`)
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleEvent')
    }
  }

  /**
   * Handle asset.created event
   */
  private async handleAssetCreated(data: any): Promise<void> {
    try {
      const { id: assetId, playback_ids, upload_id } = data

      // If we have an upload_id, try to find an existing video
      if (upload_id) {
        const existingVideo = await this.videoRepository.findByMuxUploadId(upload_id)

        if (existingVideo) {
          const thumbnailUrl = playback_ids?.[0]?.id
            ? this.getThumbnailUrl(playback_ids[0].id)
            : undefined

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

          if (updatedVideo) {
            this.emitVideoUpdated(updatedVideo.id)
          }
          return
        }
      }

      // If no existing video found, create a new one
      const thumbnailUrl = playback_ids?.[0]?.id
        ? this.getThumbnailUrl(playback_ids[0].id)
        : undefined

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
      const { id: assetId } = data
      console.log(`Processing asset.ready event for assetId ${assetId}`)

      // Extract useful metadata from the asset data
      const { duration, aspect_ratio: aspectRatio, playback_ids: playbackIds } = data
      const playbackId = playbackIds?.[0]?.id

      // Find video with this assetId
      const video = await this.videoRepository.findByMuxAssetId(assetId)

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

      console.log(`Updating video ${video.id} status to ready`)

      // Prepare update data with all available metadata
      const updateData: any = {}

      // Add metadata fields if they're available and not already set
      if (duration && !video.duration) {
        updateData.duration = duration
      }

      if (aspectRatio && !video.aspectRatio) {
        updateData.aspectRatio = aspectRatio
      }

      // Always update muxData
      updateData.muxData = {
        ...video.muxData,
        status: 'ready',
      }

      // Add playbackId if available and not already set
      if (playbackId && !video.muxData?.playbackId) {
        updateData.muxData.playbackId = playbackId
      }

      // Update thumbnail URL if we have a playback ID
      if (playbackId && !video.muxThumbnailUrl) {
        updateData.muxThumbnailUrl = this.getThumbnailUrl(playbackId)
      }

      // Update the video with the asset data
      const updatedVideo = await this.videoRepository.update(video.id, updateData)

      if (updatedVideo) {
        console.log(
          `Successfully updated video ${video.id} status to ready with metadata:`,
          updateData,
        )
        console.log(`Emitting video_updated event for video ${video.id}`)

        // Add a special flag to indicate that this is a status change to ready
        this.emitVideoUpdated(video.id, true)
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
      const { id: uploadId, asset_id: assetId } = data

      // Find video with this uploadId
      const video = await this.videoRepository.findByMuxUploadId(uploadId)

      if (!video) {
        console.log(`No video found for uploadId ${uploadId}`)
        return
      }

      // Update the video with the asset data
      const updatedVideo = await this.videoRepository.update(video.id, {
        muxData: {
          ...video.muxData,
          assetId,
          // Only update the status if it's not already 'ready'
          ...(video.muxData?.status !== 'ready' ? { status: 'processing' } : {}),
        },
      })

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
      const { upload_id, video_quality, tracks } = data

      // Find the video with this upload ID
      const video = await this.videoRepository.findByMuxUploadId(upload_id)

      if (!video) {
        console.log(`No video found for uploadId ${upload_id}`)
        return
      }

      // Update the video with the non-standard input information
      const updatedVideo = await this.videoRepository.update(video.id, {
        muxData: {
          ...video.muxData,
          videoQuality: video_quality,
          nonStandardInput: true,
          tracks: tracks,
        },
      })

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
      console.log(`Emitting video_created event for video ${id}`)
      this.eventEmitter('video_created', { id })
      console.log(`Successfully emitted video_created event for video ${id}`)
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
      console.log(`Emitting video_updated event for video ${id}`)
      this.eventEmitter('video_updated', { id, isStatusChange })

      // Also emit the event with the colon format to ensure compatibility
      this.eventEmitter('video:updated', { id, isStatusChange })

      // If this is a status change to ready, emit a special event
      if (isStatusChange) {
        console.log(`Emitting status_ready event for video ${id}`)
        this.eventEmitter('video:status:ready', { id })
      }

      console.log(`Successfully emitted video_updated events for video ${id}`)
    } catch (error) {
      logError(error, 'WebhookHandlerService.emitVideoUpdated')
    }
  }
}
