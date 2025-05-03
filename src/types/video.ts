export interface MuxData {
  assetId?: string
  uploadId?: string
  playbackId?: string
  status?: 'processing' | 'ready' | 'error'
  nonStandardInput?: boolean
}

export interface Video {
  id: string
  title: string
  sourceType: 'mux'
  muxData?: MuxData
  muxThumbnailUrl?: string
  duration?: number
  aspectRatio?: string
  createdAt: string
  updatedAt: string
}

// If you're using Payload CMS, you might also want these types
export type VideoCreateInput = Omit<Video, 'id' | 'createdAt' | 'updatedAt'>
export type VideoUpdateInput = Partial<VideoCreateInput>