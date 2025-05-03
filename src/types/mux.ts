/**
 * Type definitions for Mux integration
 */

// Mux Upload Types
export interface MuxUploadRequest {
  corsOrigin?: string
  newAssetSettings?: MuxAssetSettings
  metadata?: Record<string, string>
  passthrough?: Record<string, string>
}

export interface MuxAssetSettings {
  playbackPolicy?: ('public' | 'signed')[]
  perTitleEncode?: boolean
  normalizeAudio?: boolean
  masterAccess?: 'temporary' | 'none'
  drm?: {
    drmConfigurationIds?: string[]
  }
}

export interface MuxUploadResponse {
  id: string
  url: string
  corsOrigin: string
  status: string
  newAssetSettings: MuxAssetSettings
  timeout: number
}

// Mux Asset Types
export interface MuxAsset {
  id: string
  playbackIds?: MuxPlaybackId[]
  status: MuxAssetStatus
  duration?: number
  aspectRatio?: string
  maxResolution?: string
  maxStoredResolution?: string
  uploadId?: string
  createdAt?: string
  tracks?: MuxTrack[]
}

export type MuxAssetStatus = 'preparing' | 'ready' | 'errored'

export interface MuxPlaybackId {
  id: string
  policy: 'public' | 'signed'
}

export interface MuxTrack {
  id: string
  type: 'video' | 'audio' | 'text'
  duration?: number
  maxWidth?: number
  maxHeight?: number
  maxFrameRate?: number
}

// Mux Webhook Types
export interface MuxWebhookEvent {
  type: MuxWebhookEventType
  id: string
  object: {
    type: string
    id: string
  }
  created_at: string
  data: MuxWebhookData
}

export type MuxWebhookEventType =
  | 'video.asset.created'
  | 'video.asset.ready'
  | 'video.asset.errored'
  | 'video.asset.deleted'
  | 'video.upload.created'
  | 'video.upload.asset_created'
  | 'video.asset.non_standard_input_detected'
  | 'video.live_stream.created'
  | 'video.live_stream.idle'
  | 'video.live_stream.active'
  | 'video.live_stream.disconnected'
  | 'video.live_stream.recording'
  | 'video.live_stream.connected'
  | 'video.live_stream.simulcast_target.connected'
  | 'video.live_stream.simulcast_target.disconnected'
  | 'video.live_stream.simulcast_target.error'
  | 'video.simulcast.started'
  | 'video.simulcast.completed'
  | 'video.simulcast.idle'

export interface MuxWebhookData {
  id: string
  status?: MuxAssetStatus
  playback_ids?: MuxPlaybackId[]
  duration?: number
  aspect_ratio?: string
  upload_id?: string
  created_at?: string
  tracks?: MuxTrack[]
  metadata?: Record<string, string>
  passthrough?: Record<string, string>
}

// Video Document Types
export interface VideoDocument {
  id: string
  title: string
  description?: string
  slug?: string
  sourceType: 'mux' | 'embedded'
  muxData?: {
    uploadId?: string
    assetId?: string
    playbackId?: string
    status?: 'uploading' | 'processing' | 'ready' | 'error'
  }
  embeddedUrl?: string
  duration?: number
  aspectRatio?: string
  thumbnail?: {
    id: string
    url: string
  }
  muxThumbnailUrl?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Mux Live Stream Types
export interface MuxLiveStreamRequest {
  playbackPolicy?: ('public' | 'signed')[]
  newAssetSettings?: MuxAssetSettings
  reconnectWindow?: number
  recording?: boolean
  simulcastTargets?: MuxSimulcastTarget[]
}

export interface MuxSimulcastTarget {
  url: string
  stream_key: string
  name?: string
}

// Health data for live streams
export interface MuxLiveStreamHealth {
  stream_health?: 'healthy' | 'degraded' | 'failed'
  video_bitrate?: number
  video_frame_rate?: number
  video_codec?: string
  video_resolution?: string
  audio_bitrate?: number
  last_seen_time?: string
  errors?: Array<{ message: string; code?: string }>
}

export interface MuxLiveStream {
  id: string
  stream_key: string
  status: MuxLiveStreamStatus
  playback_ids?: MuxPlaybackId[]
  created_at: string
  recording?: boolean
  reconnect_window?: number
  simulcast_targets?: MuxSimulcastTarget[]
  active_asset_id?: string
  recent_asset_ids?: string[]
  // Health data
  stream_health?: 'healthy' | 'degraded' | 'failed'
  video_bitrate?: number
  video_frame_rate?: number
  video_codec?: string
  video_resolution?: string
  audio_bitrate?: number
  last_seen_time?: string
  errors?: Array<{ message: string; code?: string }>
  // Additional health metrics
  viewer_count?: number
  dropped_frames?: number
  recent_input_video_bitrate?: number
  recent_input_video_frame_rate?: number
  recent_input_audio_bitrate?: number
  recent_input_height?: number
  recent_input_width?: number
  recent_input_last_seen?: string
  active_input_connection?: {
    viewers?: number
  }
}

export type MuxLiveStreamStatus = 'idle' | 'active' | 'disconnected' | 'completed'
