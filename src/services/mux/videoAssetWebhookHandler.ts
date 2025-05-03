import { logger } from '@/utils/logger'
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
import { getMuxSettings } from '@/utilities/getMuxSettings'

export class VideoAssetWebhookHandler {
  private eventService!: EventService
  private videoAssetRepository!: VideoAssetRepository
  private initialized: boolean = false
  private muxService: any = null

  constructor(options?: { payload?: any }) {
    this.initializeServices(options?.payload)
  }

  private async initializeServices(payload?: any) {
    try {
      logger.info({ context: 'muxService' }, '🔄 Initializing VideoAssetWebhookHandler services')
      this.eventService = EventService.getInstance()
      logger.info({ context: 'muxService' }, '✅ EventService initialized')

      // Log the payload object to see what we're working with
      logger.info(
        { context: 'muxService' },
        '🔄 Initializing VideoAssetRepository with payload:',
        payload ? 'Payload provided' : 'No payload provided',
      )

      this.videoAssetRepository = new VideoAssetRepository({ payload })
      logger.info({ context: 'muxService' }, '✅ VideoAssetRepository initialized')

      // Initialize Mux service
      this.muxService = await createMuxService()
      logger.info({ context: 'muxService' }, '✅ MuxService initialized')

      this.initialized = true
      logger.info({ context: 'muxService' }, '✅ VideoAssetWebhookHandler initialized successfully')
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        '❌ Error initializing VideoAssetWebhookHandler:',
        error,
      )
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
    const timestamp = new Date().toISOString()
    logger.info(
      { context: 'muxService' },
      `🔔 WEBHOOK [${timestamp}] handleEvent called with event:`,
      JSON.stringify(event, null, 2).substring(0, 500) + '...',
    )

    if (!this.initialized) {
      logger.error(
        { context: 'muxService' },
        `❌ WEBHOOK [${timestamp}] VideoAssetWebhookHandler not properly initialized`,
      )
      throw new Error('Service not initialized')
    }

    try {
      const { type, data } = event
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Processing webhook event type: ${type}`,
      )

      // Log the data in development
      if (process.env.NODE_ENV === 'development') {
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Event data:`,
          JSON.stringify(data, null, 2),
        )
      }

      switch (type) {
        case MUX_WEBHOOK_EVENT_TYPES.ASSET_CREATED:
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Handling asset.created event`,
          )
          await this.handleAssetCreated(data)
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Completed handling asset.created event`,
          )
          break

        case MUX_WEBHOOK_EVENT_TYPES.ASSET_READY:
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Handling asset.ready event`,
          )
          await this.handleAssetReady(data)
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Completed handling asset.ready event`,
          )
          break

        case MUX_WEBHOOK_EVENT_TYPES.ASSET_DELETED:
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Handling asset.deleted event`,
          )
          await this.handleAssetDeleted(data)
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Completed handling asset.deleted event`,
          )
          break

        case MUX_WEBHOOK_EVENT_TYPES.UPLOAD_ASSET_CREATED:
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Handling upload.asset.created event`,
          )
          await this.handleUploadAssetCreated(data)
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Completed handling upload.asset.created event`,
          )
          break

        case 'video.upload.created':
          // Log but no action needed - we'll handle the asset creation
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Received video.upload.created event (no action needed)`,
          )
          break

        case MUX_WEBHOOK_EVENT_TYPES.NON_STANDARD_INPUT_DETECTED:
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Handling non-standard input event`,
          )
          await this.handleNonStandardInput(data)
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Completed handling non-standard input event`,
          )
          break

        default:
          logger.info(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Unhandled webhook event type: ${type}`,
          )
      }
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error handling webhook event:', error)

      // Log more details about the error
      if (error instanceof Error) {
        logger.error({ context: 'muxService' }, 'Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      }

      throw error
    }
  }

  private async emitEvent(event: string, data: Record<string, unknown>): Promise<void> {
    try {
      // Use direct string values to avoid TypeScript errors with enums
      await this.eventService.emit(event as any, {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'server',
      })
      logger.info({ context: 'muxService' }, `✅ Emitted event ${event} successfully`)
    } catch (error) {
      logger.error({ context: 'muxService' }, `❌ Error emitting event ${event}:`, error)
    }
  }

  /**
   * Handle asset.created event
   */
  private async handleAssetCreated(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      logger.info({ context: 'muxService' }, `🔍 DEBUG [${timestamp}] Starting handleAssetCreated`)
      logger.info(
        { context: 'muxService' },
        `🔍 DEBUG [${timestamp}] Webhook data:`,
        JSON.stringify(data, null, 2),
      )

      const { id: assetId, playback_ids, upload_id } = data
      logger.info({ context: 'muxService' }, `🔍 DEBUG [${timestamp}] Extracted data:`, {
        assetId,
        playback_ids,
        upload_id,
      })

      await this.emitEvent(EVENTS.VIDEO_UPLOAD_COMPLETED, {
        uploadId: upload_id,
        assetId,
        playbackId: playback_ids?.[0]?.id,
        status: 'processing',
      })

      if (upload_id) {
        logger.info(
          { context: 'muxService' },
          `🔍 DEBUG [${timestamp}] Searching for video asset with upload_id:`,
          upload_id,
        )
        try {
          const existingVideo = await this.videoAssetRepository.findByMuxUploadId(upload_id)
          logger.info(
            { context: 'muxService' },
            `🔍 DEBUG [${timestamp}] Search result:`,
            existingVideo ? JSON.stringify(existingVideo, null, 2) : 'null',
          )
          if (existingVideo) {
            logger.info(
              { context: 'muxService' },
              `🔍 DEBUG [${timestamp}] Found existing video, updating it`,
            )
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
              logger.info(
                { context: 'muxService' },
                `🔍 DEBUG [${timestamp}] Video updated successfully:`,
                updatedVideo.id,
              )
              await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedVideo)
            } else {
              logger.error(
                { context: 'muxService' },
                `🔍 DEBUG [${timestamp}] Failed to update video`,
              )
            }
            return
          } else {
            logger.info(
              { context: 'muxService' },
              `🔍 DEBUG [${timestamp}] No existing video found with upload_id ${upload_id}, will create new one`,
            )
          }
        } catch (error) {
          logger.error(
            { context: 'muxService' },
            `🔍 DEBUG [${timestamp}] Error finding video asset by upload_id:`,
            error,
          )
        }
      } else {
        logger.info(
          { context: 'muxService' },
          `🔍 DEBUG [${timestamp}] No upload_id provided in webhook data, will create new video asset`,
        )
      }

      // Create new video asset if no existing one found
      logger.info(
        { context: 'muxService' },
        `🔍 DEBUG [${timestamp}] Creating new video asset for assetId ${assetId}`,
      )
      const thumbnailUrl = playback_ids?.[0]?.id
        ? this.getThumbnailUrl(playback_ids[0].id)
        : undefined

      // Generate a slug from the title
      const title = `Untitled Video ${assetId}`
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

      logger.info({ context: 'muxService' }, `🔍 DEBUG [${timestamp}] Creating video with data:`, {
        title,
        slug,
        sourceType: 'mux',
        muxData: {
          assetId,
          uploadId: upload_id,
          playbackId: playback_ids?.[0]?.id,
          status: 'processing',
        },
        muxThumbnailUrl: thumbnailUrl,
      })

      try {
        // Create a new video asset with all required fields
        const videoData = {
          title,
          slug,
          sourceType: 'mux',
          muxData: {
            assetId,
            uploadId: upload_id,
            playbackId: playback_ids?.[0]?.id,
            status: 'processing',
          },
          muxThumbnailUrl: thumbnailUrl,
        }

        logger.info(
          { context: 'muxService' },
          `🔍 DEBUG [${timestamp}] Creating video asset with data:`,
          JSON.stringify(videoData, null, 2),
        )

        const newVideo = await this.videoAssetRepository.create(videoData)

        logger.info(
          { context: 'muxService' },
          `🔍 DEBUG [${timestamp}] New video created successfully:`,
          newVideo ? newVideo.id : 'null',
        )
        if (newVideo) {
          await this.emitEvent(EVENTS.VIDEO_CREATED, newVideo)
          logger.info(
            { context: 'muxService' },
            `🔍 DEBUG [${timestamp}] Emitted VIDEO_CREATED event`,
          )
        } else {
          logger.error(
            { context: 'muxService' },
            `🔍 DEBUG [${timestamp}] Failed to create new video, result was null`,
          )
        }
      } catch (createError) {
        logger.error(
          { context: 'muxService' },
          `🔍 DEBUG [${timestamp}] Error creating new video:`,
          createError,
        )
        throw createError
      }
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error handling asset created:', error)
      throw error
    }
  }

  /**
   * Handle asset.ready event
   */
  private async handleAssetReady(data: any): Promise<void> {
    const timestamp = new Date().toISOString()
    logger.info({ context: 'muxService' }, `🔔 WEBHOOK [${timestamp}] Processing asset.ready event`)

    try {
      const { id: assetId } = data
      logger.info({ context: 'muxService' }, `🔔 WEBHOOK [${timestamp}] Asset ID: ${assetId}`)

      // Extract useful metadata from the asset data
      const { duration, aspect_ratio: aspectRatio, playback_ids: playbackIds } = data
      const playbackId = playbackIds?.[0]?.id

      logger.info({ context: 'muxService' }, `🔔 WEBHOOK [${timestamp}] Asset metadata:`, {
        duration: duration || 'N/A',
        aspectRatio: aspectRatio || 'N/A',
        playbackId: playbackId || 'N/A',
      })

      // Find video with this assetId
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Looking for video asset with asset ID: ${assetId}`,
      )
      let video
      try {
        video = await this.videoAssetRepository.findByMuxAssetId(assetId)
      } catch (findError) {
        logger.error(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Database error while finding video asset:`,
          findError,
        )
        // Emit an error event that the EventMonitor can display
        await this.emitEvent(EVENTS.VIDEO_STATUS_UPDATED, {
          assetId,
          status: 'error',
          error: 'Database error while processing video',
          details: findError instanceof Error ? findError.message : String(findError),
        })
        return
      }

      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Video asset found: ${video ? 'Yes' : 'No'}`,
      )

      if (!video) {
        logger.info(
          { context: 'muxService' },
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
          logger.error(
            { context: 'muxService' },
            `🔔 WEBHOOK [${timestamp}] Error creating placeholder video asset:`,
            createError,
          )
          await this.emitEvent(EVENTS.VIDEO_STATUS_UPDATED, {
            assetId,
            status: 'error',
            error: 'Failed to create video asset record',
            details: createError instanceof Error ? createError.message : String(createError),
          })
        }
        return
      }

      logger.info(
        { context: 'muxService' },
        `Found video asset ${video.id} for assetId ${assetId}, current status: ${video.muxData?.status}`,
      )

      // Only update if status is not already 'ready'
      if (video.muxData?.status === 'ready') {
        logger.info(
          { context: 'muxService' },
          `Video asset ${video.id} is already in ready state, skipping update`,
        )
        return
      }

      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Updating video asset ${video.id} status to ready`,
      )

      // Prepare update data with all available metadata
      const updateData: any = {}

      // Add metadata fields if they're available and not already set
      if (duration && !video.duration) {
        updateData.duration = duration
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Setting duration: ${duration}`,
        )
      }

      if (aspectRatio && !video.aspectRatio) {
        updateData.aspectRatio = aspectRatio
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Setting aspect ratio: ${aspectRatio}`,
        )
      }

      // Always update muxData
      updateData.muxData = {
        ...video.muxData,
        status: 'ready',
      }
      logger.info({ context: 'muxService' }, `🔔 WEBHOOK [${timestamp}] Setting status: ready`)

      // Add playbackId if available and not already set
      if (playbackId && !video.muxData?.playbackId) {
        updateData.muxData.playbackId = playbackId
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Setting playback ID: ${playbackId}`,
        )
      }

      // Update thumbnail URL if we have a playback ID
      if (playbackId && !video.muxThumbnailUrl) {
        const thumbnailUrl = this.getThumbnailUrl(playbackId)
        updateData.muxThumbnailUrl = thumbnailUrl
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Setting thumbnail URL: ${thumbnailUrl}`,
        )
      }

      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Update data:`,
        JSON.stringify(updateData, null, 2),
      )

      // Update the video with the asset data
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Updating video asset in database...`,
      )
      try {
        // Clear the cache for this asset to ensure fresh data on next fetch
        this.muxService.clearAssetCache(assetId)
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Cleared cache for asset ${assetId}`,
        )

        const updatedVideo = await this.videoAssetRepository.update(video.id, updateData)
        if (updatedVideo) {
          await this.emitEvent(EVENTS.VIDEO_STATUS_READY, updatedVideo)
        }
      } catch (updateError) {
        logger.error(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Error updating video asset:`,
          updateError,
        )
        await this.emitEvent(EVENTS.VIDEO_STATUS_UPDATED, {
          id: video.id,
          assetId,
          status: 'error',
          error: 'Failed to update video asset record',
          details: updateError instanceof Error ? updateError.message : String(updateError),
        })
      }
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Unhandled error in handleAssetReady:`,
        error,
      )
      await this.emitEvent(EVENTS.VIDEO_STATUS_UPDATED, {
        status: 'error',
        error: 'Unhandled error processing video',
        details: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Handle upload.asset_created event
   */
  private async handleUploadAssetCreated(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Processing upload.asset_created event`,
      )

      const { id: uploadId, asset_id: assetId } = data

      logger.info({ context: 'muxService' }, `🔔 WEBHOOK [${timestamp}] Upload ID: ${uploadId}`)
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Asset ID: ${assetId || 'N/A'}`,
      )

      // Find video with this uploadId
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Looking for video asset with upload ID: ${uploadId}`,
      )
      const video = await this.videoAssetRepository.findByMuxUploadId(uploadId)
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Video asset found: ${video ? 'Yes' : 'No'}`,
      )

      if (!video) {
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] No video asset found for uploadId ${uploadId}, skipping update`,
        )
        return
      }

      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Found video asset ID: ${video.id}`,
      )
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Current video asset status: ${video.muxData?.status || 'N/A'}`,
      )

      // Prepare update data
      const updateStatus = video.muxData?.status !== 'ready'
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Will update status: ${updateStatus ? 'Yes' : 'No'}`,
      )

      // Check if this is a DRM-protected asset by examining the playback policy
      const isDrmProtected =
        data.playback_policy?.includes('signed') && data.drm?.drm_configuration_ids?.length > 0

      // Get the DRM configuration ID if available
      const drmConfigurationId =
        isDrmProtected && data.drm?.drm_configuration_ids?.length > 0
          ? data.drm.drm_configuration_ids[0]
          : null

      if (isDrmProtected) {
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] DRM detected for asset with configuration ID: ${drmConfigurationId}`,
        )
      }

      const updateData: any = {
        muxData: {
          ...video.muxData,
          assetId,
          // Only update the status if it's not already 'ready'
          ...(updateStatus ? { status: 'processing' } : {}),
        },
      }

      // If DRM is detected, update the DRM settings
      if (isDrmProtected) {
        // Get the global settings to determine if this is using global defaults
        const muxSettings = await getMuxSettings()
        const isUsingGlobalDefaults =
          muxSettings.enableDRMByDefault &&
          drmConfigurationId === muxSettings.defaultDRMConfigurationId

        // Update the DRM settings
        updateData.overrideDRM = !isUsingGlobalDefaults
        updateData.useDRM = true

        // Only set the configuration ID if overriding the global defaults
        if (!isUsingGlobalDefaults && drmConfigurationId) {
          updateData.drmConfigurationId = drmConfigurationId
        }

        logger.info({ context: 'muxService' }, `🔔 WEBHOOK [${timestamp}] Setting DRM fields:`, {
          overrideDRM: updateData.overrideDRM,
          useDRM: updateData.useDRM,
          drmConfigurationId: updateData.drmConfigurationId || '(using global default)',
          isUsingGlobalDefaults,
        })
      }

      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Setting asset ID: ${assetId}`,
      )
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Update data:`,
        JSON.stringify(updateData, null, 2),
      )

      // Update the video with the asset data
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Updating video asset in database...`,
      )

      // Clear the cache for this asset to ensure fresh data on next fetch
      if (assetId) {
        this.muxService.clearAssetCache(assetId)
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Cleared cache for asset ${assetId}`,
        )
      }

      const updatedVideo = await this.videoAssetRepository.update(video.id, updateData)
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Video asset update result: ${updatedVideo ? 'Success' : 'Failed'}`,
      )

      if (updatedVideo) {
        logger.info({ context: 'muxService' }, `Updated video asset ${video.id} with Mux asset ID`)
        await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedVideo)
      }
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error in handleUploadAssetCreated:', error)
    }
  }

  /**
   * Handle asset.deleted event
   */
  private async handleAssetDeleted(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Processing asset.deleted event`,
      )

      const { id: assetId } = data
      logger.info({ context: 'muxService' }, `🔔 WEBHOOK [${timestamp}] Asset ID: ${assetId}`)

      // Find video with this assetId
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Looking for video asset with asset ID: ${assetId}`,
      )
      const video = await this.videoAssetRepository.findByMuxAssetId(assetId)
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Video asset found: ${video ? 'Yes' : 'No'}`,
      )

      if (!video) {
        logger.info(
          { context: 'muxService' },
          `No video asset found for assetId ${assetId}, nothing to delete`,
        )
        return
      }

      logger.info(
        { context: 'muxService' },
        `Found video asset ${video.id} for assetId ${assetId}, proceeding with deletion`,
      )

      // Clear the cache for this asset
      this.muxService.clearAssetCache(assetId)
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Cleared cache for asset ${assetId}`,
      )

      // Delete the video from our database
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Deleting video asset ${video.id} from database...`,
      )
      const success = await this.videoAssetRepository.delete(video.id)
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Video asset deletion result: ${success ? 'Success' : 'Failed'}`,
      )

      if (success) {
        logger.info(
          { context: 'muxService' },
          `Successfully deleted video asset ${video.id} after Mux asset deletion`,
        )
        await this.emitEvent(EVENTS.VIDEO_DELETED, { id: video.id })
      } else {
        logger.error(
          { context: 'muxService' },
          `Failed to delete video asset ${video.id} after Mux asset deletion`,
        )
      }
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error in handleAssetDeleted:', error)
    }
  }

  /**
   * Handle non-standard input detected event
   */
  private async handleNonStandardInput(data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Processing non-standard input detected event`,
      )

      const { upload_id, video_quality, tracks } = data

      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Upload ID: ${upload_id || 'N/A'}`,
      )
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Video Quality: ${video_quality || 'N/A'}`,
      )
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Tracks:`,
        JSON.stringify(tracks || [], null, 2),
      )

      // Find the video with this upload ID
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Looking for video asset with upload ID: ${upload_id}`,
      )
      const video = await this.videoAssetRepository.findByMuxUploadId(upload_id)
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Video asset found: ${video ? 'Yes' : 'No'}`,
      )

      if (!video) {
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] No video asset found for uploadId ${upload_id}, skipping update`,
        )
        return
      }

      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Found video asset ID: ${video.id}`,
      )
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Current video asset status: ${video.muxData?.status || 'N/A'}`,
      )

      // Update the video with the non-standard input information
      // Create a custom update object to avoid type issues
      const muxDataUpdate: any = {
        ...video.muxData,
        nonStandardInput: true,
      }
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Setting nonStandardInput: true`,
      )

      // Add video quality if available
      if (video_quality) {
        muxDataUpdate.videoQuality = video_quality
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Setting videoQuality: ${video_quality}`,
        )
      }

      // Add tracks if available
      if (tracks) {
        muxDataUpdate.tracks = tracks
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Setting tracks:`,
          JSON.stringify(tracks, null, 2),
        )
      }

      const updateData = {
        muxData: muxDataUpdate,
      }

      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Update data:`,
        JSON.stringify(updateData, null, 2),
      )

      // Update the video with the non-standard input information
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Updating video asset in database...`,
      )

      // Clear the cache if we have an asset ID
      if (video.muxData?.assetId) {
        this.muxService.clearAssetCache(video.muxData.assetId)
        logger.info(
          { context: 'muxService' },
          `🔔 WEBHOOK [${timestamp}] Cleared cache for asset ${video.muxData.assetId}`,
        )
      }

      const updatedVideo = await this.videoAssetRepository.update(video.id, updateData)
      logger.info(
        { context: 'muxService' },
        `🔔 WEBHOOK [${timestamp}] Video asset update result: ${updatedVideo ? 'Success' : 'Failed'}`,
      )

      if (updatedVideo) {
        logger.info(
          { context: 'muxService' },
          `Updated video asset ${video.id} with non-standard input information`,
        )
        await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedVideo)
      }
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error in handleNonStandardInput:', error)
    }
  }
}

// Export the class directly
export default VideoAssetWebhookHandler
