import { logger } from '@/utils/logger'
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
    logger.info({ context: 'muxService' }, 'MockMuxService initialized')
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
   * Clear the cache for a specific asset or all assets
   */
  clearAssetCache(assetId?: string): void {
    logger.info(
      { context: 'muxService' },
      `[MockMuxService] Clearing cache${assetId ? ` for asset ${assetId}` : ''}`,
    )
    // No actual cache in mock service, this is just a stub
  }

  /**
   * Update an asset
   */
  async updateAsset(assetId: string, data: any): Promise<any> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Updating Mux asset ${assetId} with data:`,
        data,
      )

      // Simulate successful update
      return {
        id: assetId,
        playback_policy: data.playback_policy || ['public'],
        mp4_support: data.mp4_support || 'none',
        encoding_tier: data.encoding_tier || 'basic',
        max_resolution_tier: data.max_resolution_tier || '1080p',
        normalize_audio: data.normalize_audio !== undefined ? data.normalize_audio : false,
        generated_subtitles: data.generated_subtitles || [],
      }
    } catch (error) {
      logError(error, 'MockMuxService.updateAsset')
      throw new Error(
        `Failed to update mock Mux asset: ${error instanceof Error ? error.message : String(error)}`,
      )
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
  async verifyWebhookSignature(signature: string, body: string): Promise<boolean> {
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
  async generateSignedPlaybackUrl(
    playbackId: string,
    options: {
      expiresIn?: number // seconds
      tokenType?: 'jwt' | 'token'
      keyId?: string
      keySecret?: string
    } = {},
  ): Promise<string> {
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

  /**
   * Create a Mux thumbnail for an asset
   */
  async createMuxThumbnail(assetId: string, time: number = 0): Promise<{ url: string }> {
    try {
      // Get the mock asset
      const asset = await this.getAsset(assetId)
      if (!asset) {
        throw new Error('Asset not found')
      }

      const playbackId = asset.playbackIds?.[0]?.id

      if (!playbackId) {
        throw new Error('No playback ID found for asset')
      }

      // Return the thumbnail URL
      const thumbnailUrl = this.getThumbnailUrl(playbackId, { time })

      return { url: thumbnailUrl }
    } catch (error) {
      logError(error, 'MockMuxService.createMuxThumbnail')
      throw new Error('Failed to create Mux thumbnail')
    }
  }

  /**
   * Get a limited number of assets for deletion
   * @param limit Maximum number of assets to return
   */
  async getAllAssets(limit: number = 20): Promise<MuxAsset[]> {
    try {
      // Only return mock assets on the first call
      if (this._assetsReturned) {
        return []
      }

      // Mark that we've returned assets
      this._assetsReturned = true

      // Return a few mock assets (limited by the limit parameter)
      const mockAssets = [
        {
          id: `mock-asset-1`,
          playbackIds: [{ id: 'mock-playback-1', policy: 'public' }],
          status: 'ready',
          duration: 120,
          aspectRatio: '16:9',
          createdAt: new Date().toISOString(),
        } as unknown as MuxAsset,
        {
          id: `mock-asset-2`,
          playbackIds: [{ id: 'mock-playback-2', policy: 'public' }],
          status: 'ready',
          duration: 180,
          aspectRatio: '16:9',
          createdAt: new Date().toISOString(),
        } as unknown as MuxAsset,
      ]

      return mockAssets.slice(0, limit)
    } catch (error) {
      logError(error, 'MockMuxService.getAllAssets')
      return []
    }
  }

  // Track if we've already returned assets
  private _assetsReturned = false

  /**
   * Delete all Mux assets recursively
   * @param previousResults Optional results from previous recursive calls
   * @param recursionDepth Current recursion depth to prevent infinite loops
   */
  async deleteAllMuxAssets(
    previousResults?: {
      successCount: number
      failureCount: number
      totalCount: number
    },
    recursionDepth: number = 0,
  ): Promise<{
    success: boolean
    count: number
    failedCount: number
    totalCount: number
  }> {
    try {
      // Initialize results if this is the first call
      const currentResults = previousResults || {
        successCount: 0,
        failureCount: 0,
        totalCount: 0,
      }

      // If this is the first call, simulate finding and deleting assets
      if (!previousResults) {
        // Simulate successful deletion of assets
        const batchResults = {
          successCount: 2,
          failureCount: 0,
          totalCount: 2,
        }

        // Update the running totals
        const updatedResults = {
          successCount: currentResults.successCount + batchResults.successCount,
          failureCount: currentResults.failureCount + batchResults.failureCount,
          totalCount: currentResults.totalCount + batchResults.totalCount,
        }

        // Return the results
        return {
          success: true,
          count: updatedResults.successCount,
          failedCount: updatedResults.failureCount,
          totalCount: updatedResults.totalCount,
        }
      }

      // If this is a recursive call, simulate no more assets found
      return {
        success: true,
        count: currentResults.successCount,
        failedCount: currentResults.failureCount,
        totalCount: currentResults.totalCount,
      }
    } catch (error) {
      logError(error, 'MockMuxService.deleteAllMuxAssets')
      throw new Error('Failed to delete all Mux assets')
    }
  }
}
