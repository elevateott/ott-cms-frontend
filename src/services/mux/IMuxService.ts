import {
  MuxUploadRequest,
  MuxAsset,
  MuxWebhookEvent,
  MuxTrack,
  MuxLiveStream,
  MuxLiveStreamRequest,
} from '@/types/mux'
import { SubtitleTrack } from '@/types/videoAsset'

export interface IMuxService {
  createDirectUpload(options?: MuxUploadRequest): Promise<{
    uploadId: string
    url: string
  }>
  getAsset(assetId: string): Promise<MuxAsset | null>
  getAllAssets(limit?: number): Promise<MuxAsset[]>
  deleteAsset(assetId: string): Promise<boolean>
  updateAsset(assetId: string, data: any): Promise<any>
  clearAssetCache(assetId?: string): void
  getThumbnailUrl(
    playbackId: string,
    options?: {
      width?: number
      height?: number
      time?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    },
  ): string
  verifyWebhookSignature(signature: string, body: string): Promise<boolean>
  parseWebhookEvent(body: string): MuxWebhookEvent | null
  getStoryboardUrl(
    playbackId: string,
    options?: {
      width?: number
      height?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    },
  ): string
  getGifUrl(
    playbackId: string,
    options?: {
      width?: number
      height?: number
      time?: number
      duration?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    },
  ): string
  generateSignedPlaybackUrl(
    playbackId: string,
    options?: {
      expiresIn?: number
      tokenType?: 'jwt' | 'token'
      keyId?: string
      keySecret?: string
    },
  ): Promise<string>

  /**
   * Create a Mux thumbnail for an asset
   */
  createMuxThumbnail(assetId: string, time?: number): Promise<{ url: string }>

  /**
   * Delete all Mux assets recursively
   * @param previousResults Optional results from previous recursive calls
   * @param recursionDepth Current recursion depth to prevent infinite loops
   */
  deleteAllMuxAssets(
    previousResults?: {
      successCount: number
      failureCount: number
      totalCount: number
    },
    recursionDepth?: number,
  ): Promise<{
    success: boolean
    count: number
    failedCount: number
    totalCount: number
  }>

  /**
   * Create a subtitle track for a Mux asset
   * @param assetId Mux asset ID
   * @param subtitleData Subtitle track data
   * @param fileUrl URL to the subtitle file
   */
  createSubtitleTrack(
    assetId: string,
    subtitleData: {
      language: string
      name?: string
      closedCaptions?: boolean
      type?: 'subtitles' | 'captions'
    },
    fileUrl: string,
  ): Promise<{
    id: string
    url?: string
  }>

  /**
   * Get all subtitle tracks for a Mux asset
   * @param assetId Mux asset ID
   */
  getSubtitleTracks(assetId: string): Promise<MuxTrack[]>

  /**
   * Delete a subtitle track from a Mux asset
   * @param assetId Mux asset ID
   * @param trackId Mux track ID
   */
  deleteSubtitleTrack(assetId: string, trackId: string): Promise<boolean>

  /**
   * Generate auto-captions for a Mux asset
   * @param assetId Mux asset ID
   * @param language Language code for the captions
   */
  generateAutoCaptions(
    assetId: string,
    options?: {
      language?: string
    },
  ): Promise<{
    id: string
  }>

  /**
   * Create a Mux live stream
   * @param options Live stream options
   */
  createLiveStream(options?: MuxLiveStreamRequest): Promise<MuxLiveStream>

  /**
   * Get a Mux live stream by ID
   * @param liveStreamId Mux live stream ID
   */
  getLiveStream(liveStreamId: string): Promise<MuxLiveStream | null>

  /**
   * Get all Mux live streams
   * @param limit Maximum number of live streams to return
   */
  getAllLiveStreams(limit?: number): Promise<MuxLiveStream[]>

  /**
   * Delete a Mux live stream
   * @param liveStreamId Mux live stream ID
   */
  deleteLiveStream(liveStreamId: string): Promise<boolean>

  /**
   * Update a Mux live stream
   * @param liveStreamId Mux live stream ID
   * @param data Update data
   */
  updateLiveStream(liveStreamId: string, data: any): Promise<any>

  /**
   * Enable or disable recording for a live stream
   * @param liveStreamId Mux live stream ID
   * @param enable Whether to enable or disable recording
   */
  setLiveStreamRecording(liveStreamId: string, enable: boolean): Promise<any>

  /**
   * Reset a live stream's stream key
   * @param liveStreamId Mux live stream ID
   */
  resetStreamKey(liveStreamId: string): Promise<{ stream_key: string }>

  /**
   * Disable a live stream
   * @param liveStreamId Mux live stream ID
   */
  disableLiveStream(liveStreamId: string): Promise<boolean>

  /**
   * Enable a live stream
   * @param liveStreamId Mux live stream ID
   */
  enableLiveStream(liveStreamId: string): Promise<boolean>

  /**
   * Complete a live stream (signal that the stream is finished)
   * @param liveStreamId Mux live stream ID
   */
  completeLiveStream(liveStreamId: string): Promise<boolean>
}
