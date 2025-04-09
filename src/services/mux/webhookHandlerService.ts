/**
 * Webhook Handler Service
 * 
 * Handles processing of Mux webhook events
 */

import { VideoRepository } from '@/repositories/videoRepository';
import { MuxService } from './muxService';
import { MuxWebhookEvent, MuxWebhookEventType } from '@/types/mux';
import { logError } from '@/utils/errorHandler';
import { MUX_WEBHOOK_EVENT_TYPES } from '@/constants';

export class WebhookHandlerService {
  private videoRepository: VideoRepository;
  private muxService: MuxService;
  private eventEmitter: (event: string, data: any) => void;

  constructor(
    videoRepository: VideoRepository,
    muxService: MuxService,
    eventEmitter: (event: string, data: any) => void
  ) {
    this.videoRepository = videoRepository;
    this.muxService = muxService;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Handle a webhook event
   */
  async handleEvent(event: MuxWebhookEvent): Promise<void> {
    try {
      const { type, data } = event;
      
      console.log(`Processing webhook event: ${type}`);
      
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
      const { id: assetId, upload_id, playback_ids } = data;
      
      // Check if a video document already exists with this uploadId
      if (upload_id) {
        const existingVideo = await this.videoRepository.findByMuxUploadId(upload_id);
        
        if (existingVideo) {
          console.log(`Found existing video with uploadId ${upload_id}, updating it`);
          
          // Update the existing video with the asset ID
          const updatedVideo = await this.videoRepository.update(existingVideo.id, {
            muxData: {
              ...existingVideo.muxData,
              assetId,
              playbackId: playback_ids?.[0]?.id,
              status: 'processing',
            },
            // Set the muxThumbnailUrl field if we have a playback ID
            muxThumbnailUrl: playback_ids?.[0]?.id
              ? this.muxService.getThumbnailUrl(playback_ids[0].id)
              : undefined,
          });
          
          if (updatedVideo) {
            console.log(`Updated existing video ${existingVideo.id} with assetId ${assetId}`);
            this.emitVideoUpdated(updatedVideo.id);
          }
          
          return;
        }
      }
      
      // If we get here, we need to create a new video document
      // Extract the filename from the asset data
      let title = 'Untitled Video';
      
      // If there's metadata with a filename, use it as the title
      if (data.metadata && data.metadata.filename) {
        // Remove file extension from the filename
        title = data.metadata.filename.replace(/\\.[^/.]+$/, '');
      } else if (data.passthrough && data.passthrough.filename) {
        // Try to get filename from passthrough data
        title = data.passthrough.filename.replace(/\\.[^/.]+$/, '');
      }
      
      // Create a new video document
      const newVideo = await this.videoRepository.create({
        title,
        sourceType: 'mux',
        muxData: {
          assetId,
          uploadId: upload_id,
          playbackId: playback_ids?.[0]?.id,
          status: 'processing',
        },
        // Set the muxThumbnailUrl field if we have a playback ID
        muxThumbnailUrl: playback_ids?.[0]?.id
          ? this.muxService.getThumbnailUrl(playback_ids[0].id)
          : undefined,
        duration: data.duration || 0,
        publishedAt: new Date().toISOString(),
      });
      
      if (newVideo) {
        console.log(`Created new video from Mux asset: ${newVideo.id}`);
        this.emitVideoCreated(newVideo.id);
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleAssetCreated');
    }
  }

  /**
   * Handle asset.ready event
   */
  private async handleAssetReady(data: any): Promise<void> {
    try {
      const { id: assetId, upload_id, playback_ids, aspect_ratio, duration } = data;
      
      // First try to find the video with this assetId
      let video = await this.videoRepository.findByMuxAssetId(assetId);
      
      // If no video found and we have an upload_id, try to find by uploadId
      if (!video && upload_id) {
        video = await this.videoRepository.findByMuxUploadId(upload_id);
      }
      
      if (!video) {
        console.log(`No video found for assetId ${assetId}`);
        return;
      }
      
      // Update the video with the Mux asset data
      const updatedVideo = await this.videoRepository.update(video.id, {
        muxData: {
          ...video.muxData,
          status: 'ready',
          playbackId: playback_ids?.[0]?.id,
        },
        aspectRatio: aspect_ratio,
        duration: duration,
        // Set the muxThumbnailUrl field
        muxThumbnailUrl: playback_ids?.[0]?.id
          ? this.muxService.getThumbnailUrl(playback_ids[0].id)
          : undefined,
      });
      
      if (updatedVideo) {
        console.log(`Updated video ${video.id} with Mux asset data`);
        this.emitVideoUpdated(video.id);
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleAssetReady');
    }
  }

  /**
   * Handle upload.asset_created event
   */
  private async handleUploadAssetCreated(data: any): Promise<void> {
    try {
      const { id: uploadId, asset_id: assetId } = data;
      
      // Find video with this uploadId
      const video = await this.videoRepository.findByMuxUploadId(uploadId);
      
      if (!video) {
        console.log(`No video found for uploadId ${uploadId}`);
        return;
      }
      
      // Update the video with the asset data
      const updatedVideo = await this.videoRepository.update(video.id, {
        muxData: {
          ...video.muxData,
          assetId,
          // Only update the status if it's not already 'ready'
          ...(video.muxData?.status !== 'ready' ? { status: 'processing' } : {}),
        },
      });
      
      if (updatedVideo) {
        console.log(`Updated video ${video.id} with Mux asset ID`);
        this.emitVideoUpdated(video.id);
      }
    } catch (error) {
      logError(error, 'WebhookHandlerService.handleUploadAssetCreated');
    }
  }

  /**
   * Emit video created event
   */
  private emitVideoCreated(id: string): void {
    try {
      this.eventEmitter('video_created', { id });
    } catch (error) {
      logError(error, 'WebhookHandlerService.emitVideoCreated');
    }
  }

  /**
   * Emit video updated event
   */
  private emitVideoUpdated(id: string): void {
    try {
      this.eventEmitter('video_updated', { id });
    } catch (error) {
      logError(error, 'WebhookHandlerService.emitVideoUpdated');
    }
  }
}
