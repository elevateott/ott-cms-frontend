import { MuxUploadRequest, MuxAsset, MuxWebhookEvent } from '@/types/mux'

export interface IMuxService {
  createDirectUpload(options?: MuxUploadRequest): Promise<{
    uploadId: string
    url: string
  }>
  getAsset(assetId: string): Promise<MuxAsset | null>
  deleteAsset(assetId: string): Promise<boolean>
  getThumbnailUrl(
    playbackId: string,
    options?: {
      width?: number
      height?: number
      time?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    }
  ): string
  verifyWebhookSignature(signature: string, body: string): boolean
  parseWebhookEvent(body: string): MuxWebhookEvent | null
  getStoryboardUrl(
    playbackId: string,
    options?: {
      width?: number
      height?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    }
  ): string
  getGifUrl(
    playbackId: string,
    options?: {
      width?: number
      height?: number
      time?: number
      duration?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    }
  ): string
  generateSignedPlaybackUrl(
    playbackId: string,
    options?: {
      expiresIn?: number
      tokenType?: 'jwt' | 'token'
      keyId?: string
      keySecret?: string
    }
  ): string
}