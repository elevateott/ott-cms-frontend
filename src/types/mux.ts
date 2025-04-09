/**
 * Type definitions for Mux integration
 */

// Mux Upload Types
export interface MuxUploadRequest {
  corsOrigin?: string;
  newAssetSettings?: MuxAssetSettings;
  metadata?: Record<string, string>;
  passthrough?: Record<string, string>;
}

export interface MuxAssetSettings {
  playbackPolicy?: ('public' | 'signed')[];
  perTitleEncode?: boolean;
  normalizeAudio?: boolean;
  masterAccess?: 'temporary' | 'none';
}

export interface MuxUploadResponse {
  id: string;
  url: string;
  corsOrigin: string;
  status: string;
  newAssetSettings: MuxAssetSettings;
  timeout: number;
}

// Mux Asset Types
export interface MuxAsset {
  id: string;
  playbackIds?: MuxPlaybackId[];
  status: MuxAssetStatus;
  duration?: number;
  aspectRatio?: string;
  maxResolution?: string;
  maxStoredResolution?: string;
  uploadId?: string;
  createdAt?: string;
  tracks?: MuxTrack[];
}

export type MuxAssetStatus = 'preparing' | 'ready' | 'errored';

export interface MuxPlaybackId {
  id: string;
  policy: 'public' | 'signed';
}

export interface MuxTrack {
  id: string;
  type: 'video' | 'audio' | 'text';
  duration?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxFrameRate?: number;
}

// Mux Webhook Types
export interface MuxWebhookEvent {
  type: MuxWebhookEventType;
  id: string;
  object: {
    type: string;
    id: string;
  };
  created_at: string;
  data: MuxWebhookData;
}

export type MuxWebhookEventType = 
  | 'video.asset.created'
  | 'video.asset.ready'
  | 'video.asset.errored'
  | 'video.upload.created'
  | 'video.upload.asset_created'
  | 'video.asset.non_standard_input_detected';

export interface MuxWebhookData {
  id: string;
  status?: MuxAssetStatus;
  playback_ids?: MuxPlaybackId[];
  duration?: number;
  aspect_ratio?: string;
  upload_id?: string;
  created_at?: string;
  tracks?: MuxTrack[];
  metadata?: Record<string, string>;
  passthrough?: Record<string, string>;
}

// Video Document Types
export interface VideoDocument {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  sourceType: 'mux' | 'embedded';
  muxData?: {
    uploadId?: string;
    assetId?: string;
    playbackId?: string;
    status?: 'uploading' | 'processing' | 'ready' | 'error';
  };
  embeddedUrl?: string;
  duration?: number;
  aspectRatio?: string;
  thumbnail?: {
    id: string;
    url: string;
  };
  muxThumbnailUrl?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
