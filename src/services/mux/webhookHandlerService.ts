/**
 * Mux Webhook Handler Service
 *
 * Handles processing of Mux webhook events for the VideoAssets collection
 */

import { EventService } from '@/services/eventService'
import { EVENTS } from '@/constants/events'
import { MUX_WEBHOOK_EVENT_TYPES } from '@/constants'
import VideoAssetRepository from '@/repositories/videoAssetRepository'
import { logError } from '@/utilities/errorLogging'

export class WebhookHandlerService {
  private static instance: WebhookHandlerService
  private eventService: EventService
  private videoAssetRepository: VideoAssetRepository
  private initialized: boolean = false

  private constructor() {
    this.initialize()
  }

  public static getInstance(): WebhookHandlerService {
    if (!WebhookHandlerService.instance) {
      WebhookHandlerService.instance = new WebhookHandlerService()
    }
    return WebhookHandlerService.instance
  }

  private initialize(): void {
    try {
      this.eventService = EventService.getInstance()
      this.videoAssetRepository = new VideoAssetRepository()
      this.initialized = true
      console.log('✅ WebhookHandlerService initialized successfully')
    } catch (error) {
      console.error('❌ Error initializing WebhookHandlerService:', error)
      throw error
    }
  }

  private getThumbnailUrl(playbackId: string): string {
    return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=preserve`
  }

  private async emitEvent(eventName: keyof typeof EVENTS, data: any): Promise<void> {
    await this.eventService.emit(eventName, {
      ...data,
      timestamp: new Date().toISOString(),
      source: 'webhook',
    })
  }

  /**
   * Handle incoming webhook event
   */
  public async handleWebhook(event: any): Promise<void> {
    if (!this.initialized) {
      throw new Error('Service not initialized')
    }

    const timestamp = new Date().toISOString()
    const { type, data } = event
    console.log(`🔔 WEBHOOK [${timestamp}] Received webhook event: ${type}`)

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

      case MUX_WEBHOOK_EVENT_TYPES.NON_STANDARD_INPUT_DETECTED:
        await this.handleNonStandardInput(data)
        break

      default:
        console.log(`🔔 WEBHOOK [${timestamp}] Unhandled webhook event type: ${type}`)
    }
  }

  /**
   * Handle asset.created event
   */
  private async handleAssetCreated(data: any): Promise<void> {
    const timestamp = new Date().toISOString()
    console.log(`🔔 WEBHOOK [${timestamp}] Processing asset.created event`)

    try {
      const { id: assetId, playback_ids, upload_id } = data

      // Emit event first
      await this.emitEvent(EVENTS.VIDEO_UPLOAD_COMPLETED, {
        uploadId: upload_id,
        assetId,
        playbackId: playback_ids?.[0]?.id,
        status: 'processing',
      })

      // Update existing asset if found
      if (upload_id) {
        const existingAsset = await this.videoAssetRepository.findByMuxUploadId(upload_id)
        if (existingAsset) {
          const thumbnailUrl = playback_ids?.[0]?.id
            ? this.getThumbnailUrl(playback_ids[0].id)
            : undefined

          const updatedAsset = await this.videoAssetRepository.update(existingAsset.id, {
            muxData: {
              ...existingAsset.muxData,
              assetId,
              playbackId: playback_ids?.[0]?.id,
              status: 'processing',
            },
            muxThumbnailUrl: thumbnailUrl,
          })

          if (updatedAsset) {
            await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedAsset)
          }
          return
        }
      }

      // Create new asset if none exists
      const thumbnailUrl = playback_ids?.[0]?.id
        ? this.getThumbnailUrl(playback_ids[0].id)
        : undefined

      const newAsset = await this.videoAssetRepository.create({
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

      await this.emitEvent(EVENTS.VIDEO_CREATED, newAsset)
    } catch (error) {
      console.error(`🔔 WEBHOOK [${timestamp}] Error handling asset created:`, error)
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
      const { id: assetId, duration, aspect_ratio: aspectRatio, playback_ids: playbackIds } = data
      const playbackId = playbackIds?.[0]?.id

      const asset = await this.videoAssetRepository.findByMuxAssetId(assetId)
      if (!asset) {
        console.log(`🔔 WEBHOOK [${timestamp}] No asset found for assetId ${assetId}`)
        return
      }

      const updateData: any = {
        muxData: {
          ...asset.muxData,
          status: 'ready',
        },
      }

      if (duration) updateData.duration = duration
      if (aspectRatio) updateData.aspectRatio = aspectRatio
      if (playbackId && !asset.muxData?.playbackId) {
        updateData.muxData.playbackId = playbackId
        updateData.muxThumbnailUrl = this.getThumbnailUrl(playbackId)
      }

      const updatedAsset = await this.videoAssetRepository.update(asset.id, updateData)
      if (updatedAsset) {
        await this.emitEvent(EVENTS.VIDEO_STATUS_READY, updatedAsset)
      }
    } catch (error) {
      console.error(`🔔 WEBHOOK [${timestamp}] Error handling asset ready:`, error)
      throw error
    }
  }

  /**
   * Handle asset.deleted event
   */
  private async handleAssetDeleted(data: any): Promise<void> {
    const timestamp = new Date().toISOString()
    console.log(`🔔 WEBHOOK [${timestamp}] Processing asset.deleted event`)

    try {
      const { id: assetId } = data
      const asset = await this.videoAssetRepository.findByMuxAssetId(assetId)

      if (!asset) {
        console.log(`🔔 WEBHOOK [${timestamp}] No asset found for assetId ${assetId}`)
        return
      }

      const success = await this.videoAssetRepository.delete(asset.id)
      if (success) {
        await this.emitEvent(EVENTS.VIDEO_DELETED, { id: asset.id })
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleAssetDeleted')
    }
  }

  /**
   * Handle upload.asset_created event
   */
  private async handleUploadAssetCreated(data: any): Promise<void> {
    const timestamp = new Date().toISOString()
    console.log(`🔔 WEBHOOK [${timestamp}] Processing upload.asset_created event`)

    try {
      const { id: uploadId, asset_id: assetId } = data
      const asset = await this.videoAssetRepository.findByMuxUploadId(uploadId)

      if (!asset) {
        console.log(`🔔 WEBHOOK [${timestamp}] No asset found for uploadId ${uploadId}`)
        return
      }

      const updateData = {
        muxData: {
          ...asset.muxData,
          assetId,
          status: asset.muxData?.status !== 'ready' ? 'processing' : asset.muxData.status,
        },
      }

      const updatedAsset = await this.videoAssetRepository.update(asset.id, updateData)
      if (updatedAsset) {
        await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedAsset)
      }
    } catch (error) {
      console.error(`🔔 WEBHOOK [${timestamp}] Error in handleUploadAssetCreated:`, error)
    }
  }

  /**
   * Handle non_standard_input_detected event
   */
  private async handleNonStandardInput(data: any): Promise<void> {
    const timestamp = new Date().toISOString()
    console.log(`🔔 WEBHOOK [${timestamp}] Processing non_standard_input event`)

    try {
      const { upload_id, video_quality, tracks } = data
      const asset = await this.videoAssetRepository.findByMuxUploadId(upload_id)

      if (!asset) {
        console.log(`🔔 WEBHOOK [${timestamp}] No asset found for uploadId ${upload_id}`)
        return
      }

      const updateData = {
        muxData: {
          ...asset.muxData,
          nonStandardInput: true,
          videoQuality: video_quality,
          tracks,
        },
      }

      const updatedAsset = await this.videoAssetRepository.update(asset.id, updateData)
      if (updatedAsset) {
        await this.emitEvent(EVENTS.VIDEO_UPDATED, updatedAsset)
      }
    } catch (error) {
      console.error(`🔔 WEBHOOK [${timestamp}] Error in handleNonStandardInput:`, error)
    }
  }
}

// Export singleton instance
export const webhookHandlerService = WebhookHandlerService.getInstance()



