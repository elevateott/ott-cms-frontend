import { MuxUploadRequest, MuxAsset, MuxWebhookEvent } from '@/types/mux'

export interface IMuxService {
  createDirectUpload(options?: MuxUploadRequest): Promise<{
    uploadId: string
    url: string
  }>
  getAsset(assetId: string): Promise<MuxAsset | null>
  getAllAssets(limit?: number): Promise<MuxAsset[]>
  deleteAsset(assetId: string): Promise<boolean>
  getThumbnailUrl(
    playbackId: string,
    options?: {
      width?: number
      height?: number
      time?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    },
  ): string
  verifyWebhookSignature(signature: string, body: string): boolean
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
  ): string

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
}
