/**
 * Video Asset Webhook Handler Service
 *
 * Handles processing of Mux webhook events for the VideoAssets collection
 */

import VideoAssetRepository from '@/repositories/videoAssetRepository'
import { EventService } from '@/services/eventService'
import { EVENTS } from '@/constants/events'
import { MUX_WEBHOOK_EVENT_TYPES } from '@/constants'
import { createMuxService } from '@/services/mux'

export class VideoAssetWebhookHandler {
  private eventService: EventService
  private videoAssetRepository: VideoAssetRepository
  private initialized: boolean = false
  private muxService = createMuxService()

  constructor(payload?: any) {
    this.initializeServices(payload)
  }

  private async initializeServices(payload?: any) {
    try {
      this.eventService = EventService.getInstance()
      this.videoAssetRepository = new VideoAssetRepository({ payload })
      this.initialized = true
      console.log('✅ VideoAssetWebhookHandler initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing VideoAssetWebhookHandler:', error)
      throw error
    }
  }

  private getThumbnailUrl(playbackId: string): string {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=preserve`
  }

  /**
   * Handle a webhook event
   */
  public async handleEvent(event: any): Promise<void> {
    if (!this.initialized) {
      console.error('❌ VideoAssetWebhookHandler not properly initialized')
      throw new Error('Service not initialized')
    }

    try {
      const { type, data } = event
      console.log(`🔔 WEBHOOK [${new Date().toISOString()}] Received webhook event: ${type}`)

      switch (type) {
        case MUX_WEBHOOK_EVENT_TYPES.ASSET_CREATED:
          await this.handleAssetCreated(data)
          break

        case MUX_WEBHOOK_EVENT_TYPES.ASSET_READY:
          await this.handleAssetReady(data)
          break

        case MUX_WEBHOOK_EVENT_TYPES.ASSET_DELETED:
          await this.handleAssetDeleted(data)
          break

        case MUX_WEBHOOK_EVENT_TYPES.UPLOAD_ASSET_CREATED:
          await this.handleUploadAssetCreated(data)
          break

        case 'video.upload.created':
          // Log but no action needed - we'll handle the asset creation
          console.log('🔔 WEBHOOK: Received video.upload.created event')
          break

        case MUX_WEBHOOK_EVENT_TYPES.NON_STANDARD_INPUT_DETECTED:
          await this.handleNonStandardInput(data)
          break

        default:
          console.log(`Unhandled webhook event type: ${type}`)
      }
    } catch (error) {
      console.error('Error handling webhook event:', error)
      throw error
    }
  }

  private async emitEvent(event: keyof typeof EVENTS, data: any): Promise<void> {
    await this.eventService.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
      source: 'server',
    })
  }

  /**
   * Handle asset.created event
   */
  private async handleAssetCreated(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      console.log(`🔍 DEBUG [${timestamp}] Starting handleAssetCreated`)

      const { id: assetId, playback_ids, upload_id } = data

      await this.emitEvent(EVENTS.VIDEO_UPLOAD_COMPLETED, {
        uploadId: upload_id,
        assetId,
        playbackId: playback_ids?.[0]?.id,
        status: 'processing',
      })

      if (upload_id) {
        console.log(`🔍 DEBUG [${timestamp}] Searching for video asset with upload_id:`, upload_id)
        try {
          const existingVideo = await this.videoAssetRepository.findByMuxUploadId(upload_id)
          console.log(`🔍 DEBUG [${timestamp}] Search result:`, existingVideo)
          if (existingVideo) {
            const thumbnailUrl = playback_ids?.[0]?.id
              ? this.getThumbnailUrl(playback_ids[0].id)
              : undefined

            const updatedVideo = await this.videoAssetRepository.update(existingVideo.id, {
              muxData: {
                ...existingVideo.muxData,
                assetId,
                playbackId: playback_ids?.[0]?.id,
                status: 'processing',
              },
              muxThumbnailUrl: thumbnailUrl,
            })

            if (updatedVideo) {
              await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedVideo)
            }
            return
          }
        } catch (error) {
          console.error(`🔍 DEBUG [${timestamp}] Error finding video asset by upload_id:`, error)
        }
      }

      // Create new video asset if no existing one found
      const thumbnailUrl = playback_ids?.[0]?.id
        ? this.getThumbnailUrl(playback_ids[0].id)
        : undefined

      const newVideo = await this.videoAssetRepository.create({
        title: `Untitled Video ${assetId}`,
        sourceType: 'mux',
        muxData: {
          assetId,
          uploadId: upload_id,
          playbackId: playback_ids?.[0]?.id,
          status: 'processing',
        },
        muxThumbnailUrl: thumbnailUrl,
      })

      await this.emitEvent(EVENTS.VIDEO_CREATED, newVideo)
    } catch (error) {
      console.error('Error handling asset created:', error)
      throw error
    }
  }

  /**
   * Handle asset.ready event
   */
  private async handleAssetReady(data: any): Promise<void> {
    const timestamp = new Date().toISOString()
    console.log(`🔔 WEBHOOK [${timestamp}] Processing asset.ready event`)

    try {
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
      console.log(`🔔 WEBHOOK [${timestamp}] Looking for video asset with asset ID: ${assetId}`)
      let video
      try {
        video = await this.videoAssetRepository.findByMuxAssetId(assetId)
      } catch (findError) {
        console.error(
          `🔔 WEBHOOK [${timestamp}] Database error while finding video asset:`,
          findError,
        )
        // Emit an error event that the EventMonitor can display
        await this.emitEvent(EVENTS.VIDEO_STATUS_UPDATED, {
          assetId,
          status: 'error',
          error: 'Database error while processing video',
          details: findError.message,
        })
        return
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Video asset found: ${video ? 'Yes' : 'No'}`)

      if (!video) {
        console.log(
          `🔔 WEBHOOK [${timestamp}] No video asset found for assetId ${assetId}, creating placeholder`,
        )
        // Optionally create a placeholder video record
        try {
          const thumbnailUrl = playbackId ? this.getThumbnailUrl(playbackId) : undefined
          const newVideo = await this.videoAssetRepository.create({
            title: `Untitled Video ${assetId}`,
            sourceType: 'mux',
            muxData: {
              assetId,
              playbackId,
              status: 'ready',
            },
            duration,
            aspectRatio,
            muxThumbnailUrl: thumbnailUrl,
          })
          await this.emitEvent(EVENTS.VIDEO_CREATED, newVideo)
        } catch (createError) {
          console.error(
            `🔔 WEBHOOK [${timestamp}] Error creating placeholder video asset:`,
            createError,
          )
          await this.emitEvent(EVENTS.VIDEO_STATUS_UPDATED, {
            assetId,
            status: 'error',
            error: 'Failed to create video asset record',
            details: createError.message,
          })
        }
        return
      }

      console.log(
        `Found video asset ${video.id} for assetId ${assetId}, current status: ${video.muxData?.status}`,
      )

      // Only update if status is not already 'ready'
      if (video.muxData?.status === 'ready') {
        console.log(`Video asset ${video.id} is already in ready state, skipping update`)
        return
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Updating video asset ${video.id} status to ready`)

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
      console.log(`🔔 WEBHOOK [${timestamp}] Updating video asset in database...`)
      try {
        // Clear the cache for this asset to ensure fresh data on next fetch
        this.muxService.clearAssetCache(assetId)
        console.log(`🔔 WEBHOOK [${timestamp}] Cleared cache for asset ${assetId}`)

        const updatedVideo = await this.videoAssetRepository.update(video.id, updateData)
        if (updatedVideo) {
          await this.emitEvent(EVENTS.VIDEO_STATUS_READY, updatedVideo)
        }
      } catch (updateError) {
        console.error(`🔔 WEBHOOK [${timestamp}] Error updating video asset:`, updateError)
        await this.emitEvent(EVENTS.VIDEO_STATUS_UPDATED, {
          id: video.id,
          assetId,
          status: 'error',
          error: 'Failed to update video asset record',
          details: updateError.message,
        })
      }
    } catch (error) {
      console.error(`🔔 WEBHOOK [${timestamp}] Unhandled error in handleAssetReady:`, error)
      await this.emitEvent(EVENTS.VIDEO_STATUS_UPDATED, {
        status: 'error',
        error: 'Unhandled error processing video',
        details: error.message,
      })
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
      console.log(`🔔 WEBHOOK [${timestamp}] Looking for video asset with upload ID: ${uploadId}`)
      const video = await this.videoAssetRepository.findByMuxUploadId(uploadId)
      console.log(`🔔 WEBHOOK [${timestamp}] Video asset found: ${video ? 'Yes' : 'No'}`)

      if (!video) {
        console.log(
          `🔔 WEBHOOK [${timestamp}] No video asset found for uploadId ${uploadId}, skipping update`,
        )
        return
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Found video asset ID: ${video.id}`)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Current video asset status: ${video.muxData?.status || 'N/A'}`,
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
      console.log(`🔔 WEBHOOK [${timestamp}] Updating video asset in database...`)

      // Clear the cache for this asset to ensure fresh data on next fetch
      if (assetId) {
        this.muxService.clearAssetCache(assetId)
        console.log(`🔔 WEBHOOK [${timestamp}] Cleared cache for asset ${assetId}`)
      }

      const updatedVideo = await this.videoAssetRepository.update(video.id, updateData)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Video asset update result: ${updatedVideo ? 'Success' : 'Failed'}`,
      )

      if (updatedVideo) {
        console.log(`Updated video asset ${video.id} with Mux asset ID`)
        await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedVideo)
      }
    } catch (error) {
      console.error('Error in handleUploadAssetCreated:', error)
    }
  }

  /**
   * Handle asset.deleted event
   */
  private async handleAssetDeleted(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      console.log(`🔔 WEBHOOK [${timestamp}] Processing asset.deleted event`)

      const { id: assetId } = data
      console.log(`🔔 WEBHOOK [${timestamp}] Asset ID: ${assetId}`)

      // Find video with this assetId
      console.log(`🔔 WEBHOOK [${timestamp}] Looking for video asset with asset ID: ${assetId}`)
      const video = await this.videoAssetRepository.findByMuxAssetId(assetId)
      console.log(`🔔 WEBHOOK [${timestamp}] Video asset found: ${video ? 'Yes' : 'No'}`)

      if (!video) {
        console.log(`No video asset found for assetId ${assetId}, nothing to delete`)
        return
      }

      console.log(`Found video asset ${video.id} for assetId ${assetId}, proceeding with deletion`)

      // Clear the cache for this asset
      this.muxService.clearAssetCache(assetId)
      console.log(`🔔 WEBHOOK [${timestamp}] Cleared cache for asset ${assetId}`)

      // Delete the video from our database
      console.log(`🔔 WEBHOOK [${timestamp}] Deleting video asset ${video.id} from database...`)
      const success = await this.videoAssetRepository.delete(video.id)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Video asset deletion result: ${success ? 'Success' : 'Failed'}`,
      )

      if (success) {
        console.log(`Successfully deleted video asset ${video.id} after Mux asset deletion`)
        await this.emitEvent(EVENTS.VIDEO_DELETED, { id: video.id })
      } else {
        console.error(`Failed to delete video asset ${video.id} after Mux asset deletion`)
      }
    } catch (error) {
      console.error('Error in handleAssetDeleted:', error)
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
      console.log(`🔔 WEBHOOK [${timestamp}] Looking for video asset with upload ID: ${upload_id}`)
      const video = await this.videoAssetRepository.findByMuxUploadId(upload_id)
      console.log(`🔔 WEBHOOK [${timestamp}] Video asset found: ${video ? 'Yes' : 'No'}`)

      if (!video) {
        console.log(
          `🔔 WEBHOOK [${timestamp}] No video asset found for uploadId ${upload_id}, skipping update`,
        )
        return
      }

      console.log(`🔔 WEBHOOK [${timestamp}] Found video asset ID: ${video.id}`)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Current video asset status: ${video.muxData?.status || 'N/A'}`,
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
      console.log(`🔔 WEBHOOK [${timestamp}] Updating video asset in database...`)

      // Clear the cache if we have an asset ID
      if (video.muxData?.assetId) {
        this.muxService.clearAssetCache(video.muxData.assetId)
        console.log(`🔔 WEBHOOK [${timestamp}] Cleared cache for asset ${video.muxData.assetId}`)
      }

      const updatedVideo = await this.videoAssetRepository.update(video.id, updateData)
      console.log(
        `🔔 WEBHOOK [${timestamp}] Video asset update result: ${updatedVideo ? 'Success' : 'Failed'}`,
      )

      if (updatedVideo) {
        console.log(`Updated video asset ${video.id} with non-standard input information`)
        await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedVideo)
      }
    } catch (error) {
      console.error('Error in handleNonStandardInput:', error)
    }
  }
}

// Export the class directly
export default VideoAssetWebhookHandler
