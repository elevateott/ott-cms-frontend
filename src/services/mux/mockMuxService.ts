/**
 * Mock Mux Service
 *
 * A mock implementation of the Mux service for testing and development
 */

import { MuxUploadRequest, MuxAsset, MuxWebhookEvent } from '@/types/mux'
import { logError } from '@/utils/errorHandler'
import { IMuxService } from '@/services/mux/IMuxService'

export class MockMuxService implements IMuxService {
  constructor() {
    console.log('MockMuxService initialized')
  }
  /**
   * Create a direct upload URL
   */
  async createDirectUpload(options: MuxUploadRequest = {}): Promise<{
    uploadId: string
    url: string
  }> {
    try {
      // Generate a mock upload ID
      const uploadId = `mock-upload-${Date.now()}`

      // Return a mock response
      return {
        uploadId,
        url: `https://mock-mux-uploads.example.com/${uploadId}`,
      }
    } catch (error) {
      logError(error, 'MockMuxService.createDirectUpload')
      throw new Error('Failed to create mock Mux direct upload')
    }
  }

  /**
   * Get asset details
   */
  async getAsset(assetId: string): Promise<MuxAsset | null> {
    try {
      // Return a mock asset
      return {
        id: assetId,
        playback_ids: [
          {
            id: `mock-playback-${assetId}`,
            policy: 'public',
          },
        ],
        status: 'ready',
        duration: 120,
        aspect_ratio: '16:9',
        created_at: new Date().toISOString(),
      } as unknown as MuxAsset
    } catch (error) {
      logError(error, 'MockMuxService.getAsset')
      return null
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      // Simulate successful deletion
      return true
    } catch (error) {
      logError(error, 'MockMuxService.deleteAsset')
      return false
    }
  }

  /**
   * Generate a thumbnail URL for an asset
   */
  getThumbnailUrl(
    playbackId: string,
    options: {
      width?: number
      height?: number
      time?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    } = {},
  ): string {
    const { width = 640, height = 360, time, fitMode = 'preserve' } = options

    // Generate a mock thumbnail URL
    let url = `https://mock-mux-images.example.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=${fitMode}`

    if (time !== undefined) {
      url += `&time=${time}`
    }

    return url
  }

  /**
   * Verify a webhook signature
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    // Always return true in mock mode
    return true
  }

  /**
   * Parse a webhook event
   */
  parseWebhookEvent(body: string): MuxWebhookEvent | null {
    try {
      return JSON.parse(body) as MuxWebhookEvent
    } catch (error) {
      logError(error, 'MockMuxService.parseWebhookEvent')
      return null
    }
  }

  /**
   * Generate a storyboard URL for an asset
   */
  getStoryboardUrl(
    playbackId: string,
    options: {
      width?: number
      height?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    } = {},
  ): string {
    const { width = 160, height = 90, fitMode = 'preserve' } = options

    return `https://mock-mux-images.example.com/${playbackId}/storyboard.jpg?width=${width}&height=${height}&fit_mode=${fitMode}`
  }

  /**
   * Generate a GIF URL for an asset
   */
  getGifUrl(
    playbackId: string,
    options: {
      width?: number
      height?: number
      time?: number
      duration?: number
      fitMode?: 'preserve' | 'cover' | 'crop'
    } = {},
  ): string {
    const { width = 640, height = 360, time = 0, duration = 5, fitMode = 'preserve' } = options

    return `https://mock-mux-images.example.com/${playbackId}/animated.gif?width=${width}&height=${height}&fit_mode=${fitMode}&time=${time}&duration=${duration}`
  }

  /**
   * Generate a signed playback URL
   */
  generateSignedPlaybackUrl(
    playbackId: string,
    options: {
      expiresIn?: number // seconds
      tokenType?: 'jwt' | 'token'
      keyId?: string
      keySecret?: string
    } = {},
  ): string {
    try {
      const {
        expiresIn = 3600, // 1 hour
      } = options

      // Calculate expiration time
      const expirationTime = Math.floor(Date.now() / 1000) + expiresIn

      // Return a mock signed URL
      return `https://mock-mux-stream.example.com/${playbackId}.m3u8?token=mock-token-${expirationTime}`
    } catch (error) {
      logError(error, 'MockMuxService.generateSignedPlaybackUrl')
      throw new Error('Failed to generate mock signed playback URL')
    }
  }
}


