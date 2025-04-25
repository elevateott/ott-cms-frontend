/**
 * Type definitions for VideoAsset
 */

export interface MuxData {
  assetId?: string
  uploadId?: string
  playbackId?: string
  status?: 'uploading' | 'processing' | 'ready' | 'error'
  nonStandardInput?: boolean
}

export interface MuxAdvancedSettings {
  videoQuality?: 'basic' | 'plus' | 'premium'
  maxResolution?: '1080p'
  playbackPolicy?: 'public' | 'signed'
  normalizeAudio?: boolean
  autoGenerateCaptions?: boolean
}

export interface VideoAsset {
  id: string
  title: string
  slug?: string
  sourceType: 'mux' | 'embedded'
  muxData?: MuxData
  muxAdvancedSettings?: MuxAdvancedSettings
  embeddedUrl?: string
  muxThumbnailUrl?: string
  duration?: number
  aspectRatio?: string
  thumbnail?: {
    id: string
    url: string
  }
  createdAt: string
  updatedAt: string
}

// Types for creating and updating video assets
export type VideoAssetCreateInput = Omit<VideoAsset, 'id' | 'createdAt' | 'updatedAt'>
export type VideoAssetUpdateInput = Partial<VideoAssetCreateInput>
