import { logger } from '@/utils/logger'
/**
 * Mock Mux Service
 *
 * A mock implementation of the Mux service for testing and development
 */

import {
  MuxUploadRequest,
  MuxAsset,
  MuxWebhookEvent,
  MuxTrack,
  MuxLiveStream,
  MuxLiveStreamRequest,
  MuxSimulcastTarget,
} from '@/types/mux'
import { SubtitleTrack } from '@/types/videoAsset'
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

  // Store mock subtitle tracks
  private _mockSubtitleTracks: Map<string, MuxTrack[]> = new Map()

  /**
   * Create a subtitle track for a Mux asset
   * @param assetId Mux asset ID
   * @param subtitleData Subtitle track data
   * @param fileUrl URL to the subtitle file
   */
  async createSubtitleTrack(
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
  }> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Creating subtitle track for asset ${assetId} with language ${subtitleData.language}`,
      )

      // Generate a mock track ID
      const trackId = `mock-track-${Date.now()}`

      // Create a mock track
      const track: MuxTrack = {
        id: trackId,
        type: 'text',
        // Add additional properties as needed
      }

      // Store the track in our mock storage
      if (!this._mockSubtitleTracks.has(assetId)) {
        this._mockSubtitleTracks.set(assetId, [])
      }
      this._mockSubtitleTracks.get(assetId)?.push(track)

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Successfully created subtitle track ${trackId} for asset ${assetId}`,
      )

      return {
        id: trackId,
        url: fileUrl,
      }
    } catch (error) {
      logError(error, 'MockMuxService.createSubtitleTrack')
      throw new Error('Failed to create mock subtitle track')
    }
  }

  /**
   * Get all subtitle tracks for a Mux asset
   * @param assetId Mux asset ID
   */
  async getSubtitleTracks(assetId: string): Promise<MuxTrack[]> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Getting subtitle tracks for asset ${assetId}`,
      )

      // Return stored tracks or empty array
      const tracks = this._mockSubtitleTracks.get(assetId) || []

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Found ${tracks.length} subtitle tracks for asset ${assetId}`,
      )

      return tracks
    } catch (error) {
      logError(error, 'MockMuxService.getSubtitleTracks')
      return []
    }
  }

  /**
   * Delete a subtitle track from a Mux asset
   * @param assetId Mux asset ID
   * @param trackId Mux track ID
   */
  async deleteSubtitleTrack(assetId: string, trackId: string): Promise<boolean> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Deleting subtitle track ${trackId} from asset ${assetId}`,
      )

      // Check if we have tracks for this asset
      if (!this._mockSubtitleTracks.has(assetId)) {
        return false
      }

      // Get current tracks
      const tracks = this._mockSubtitleTracks.get(assetId) || []

      // Find the track index
      const trackIndex = tracks.findIndex((track) => track.id === trackId)

      // If track not found, return false
      if (trackIndex === -1) {
        return false
      }

      // Remove the track
      tracks.splice(trackIndex, 1)

      // Update the stored tracks
      this._mockSubtitleTracks.set(assetId, tracks)

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Successfully deleted subtitle track ${trackId} from asset ${assetId}`,
      )

      return true
    } catch (error) {
      logError(error, 'MockMuxService.deleteSubtitleTrack')
      return false
    }
  }

  /**
   * Generate auto-captions for a Mux asset
   * @param assetId Mux asset ID
   * @param options Options for auto-caption generation
   */
  async generateAutoCaptions(
    assetId: string,
    options?: {
      language?: string
    },
  ): Promise<{
    id: string
  }> {
    try {
      const language = options?.language || 'en'
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Generating auto-captions for asset ${assetId} in language ${language}`,
      )

      // Generate a mock track ID
      const trackId = `mock-auto-caption-${Date.now()}`

      // Create a mock track
      const track: MuxTrack = {
        id: trackId,
        type: 'text',
        // Add additional properties as needed
      }

      // Store the track in our mock storage
      if (!this._mockSubtitleTracks.has(assetId)) {
        this._mockSubtitleTracks.set(assetId, [])
      }
      this._mockSubtitleTracks.get(assetId)?.push(track)

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Successfully generated auto-captions for asset ${assetId}`,
      )

      return {
        id: trackId,
      }
    } catch (error) {
      logError(error, 'MockMuxService.generateAutoCaptions')
      throw new Error('Failed to generate mock auto-captions')
    }
  }

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

  // Store mock live streams
  private _mockLiveStreams: Map<string, MuxLiveStream> = new Map()

  /**
   * Create a Mux live stream
   * @param options Live stream options
   */
  async createLiveStream(options: MuxLiveStreamRequest = {}): Promise<MuxLiveStream> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Creating live stream with options:`,
        options,
      )

      // Generate a mock live stream ID
      const liveStreamId = `mock-live-stream-${Date.now()}`

      // Generate a mock stream key
      const streamKey = `mock-stream-key-${Date.now()}`

      // Generate a mock playback ID
      const playbackId = `mock-playback-${Date.now()}`

      // Create a mock live stream
      const liveStream: MuxLiveStream = {
        id: liveStreamId,
        stream_key: streamKey,
        status: 'idle',
        playback_ids: [
          {
            id: playbackId,
            policy: options.playbackPolicy?.[0] || 'public',
          },
        ],
        created_at: new Date().toISOString(),
        recording: options.recording !== undefined ? options.recording : false,
        reconnect_window: options.reconnectWindow || 60,
        simulcast_targets: options.simulcastTargets || [],
      }

      // Store the live stream in our mock storage
      this._mockLiveStreams.set(liveStreamId, liveStream)

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Successfully created live stream ${liveStreamId}`,
      )

      return liveStream
    } catch (error) {
      logError(error, 'MockMuxService.createLiveStream')
      throw new Error('Failed to create mock live stream')
    }
  }

  /**
   * Get a Mux live stream by ID
   * @param liveStreamId Mux live stream ID
   */
  async getLiveStream(liveStreamId: string): Promise<MuxLiveStream | null> {
    try {
      logger.info({ context: 'muxService' }, `[MockMuxService] Getting live stream ${liveStreamId}`)

      // Return the stored live stream or null
      const liveStream = this._mockLiveStreams.get(liveStreamId) || null

      if (liveStream) {
        logger.info({ context: 'muxService' }, `[MockMuxService] Found live stream ${liveStreamId}`)
      } else {
        logger.info(
          { context: 'muxService' },
          `[MockMuxService] Live stream ${liveStreamId} not found`,
        )
      }

      return liveStream
    } catch (error) {
      logError(error, 'MockMuxService.getLiveStream')
      return null
    }
  }

  /**
   * Get all Mux live streams
   * @param limit Maximum number of live streams to return
   */
  async getAllLiveStreams(limit: number = 100): Promise<MuxLiveStream[]> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Getting all live streams (limit: ${limit})`,
      )

      // Convert the map values to an array and limit the results
      const liveStreams = Array.from(this._mockLiveStreams.values()).slice(0, limit)

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Found ${liveStreams.length} live streams`,
      )

      return liveStreams
    } catch (error) {
      logError(error, 'MockMuxService.getAllLiveStreams')
      return []
    }
  }

  /**
   * Delete a Mux live stream
   * @param liveStreamId Mux live stream ID
   */
  async deleteLiveStream(liveStreamId: string): Promise<boolean> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Deleting live stream ${liveStreamId}`,
      )

      // Check if the live stream exists
      if (!this._mockLiveStreams.has(liveStreamId)) {
        logger.info(
          { context: 'muxService' },
          `[MockMuxService] Live stream ${liveStreamId} not found`,
        )
        return false
      }

      // Delete the live stream
      this._mockLiveStreams.delete(liveStreamId)

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Successfully deleted live stream ${liveStreamId}`,
      )

      return true
    } catch (error) {
      logError(error, 'MockMuxService.deleteLiveStream')
      return false
    }
  }

  /**
   * Update a Mux live stream
   * @param liveStreamId Mux live stream ID
   * @param data Update data
   */
  async updateLiveStream(liveStreamId: string, data: any): Promise<any> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Updating live stream ${liveStreamId}:`,
        data,
      )

      // Check if the live stream exists
      if (!this._mockLiveStreams.has(liveStreamId)) {
        logger.info(
          { context: 'muxService' },
          `[MockMuxService] Live stream ${liveStreamId} not found`,
        )
        throw new Error(`Live stream ${liveStreamId} not found`)
      }

      // Get the current live stream
      const liveStream = this._mockLiveStreams.get(liveStreamId)!

      // Update the live stream with the new data
      const updatedLiveStream = {
        ...liveStream,
        ...data,
      }

      // Store the updated live stream
      this._mockLiveStreams.set(liveStreamId, updatedLiveStream)

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Successfully updated live stream ${liveStreamId}`,
      )

      return updatedLiveStream
    } catch (error) {
      logError(error, 'MockMuxService.updateLiveStream')
      throw new Error('Failed to update mock live stream')
    }
  }

  /**
   * Enable or disable recording for a live stream
   * @param liveStreamId Mux live stream ID
   * @param enable Whether to enable or disable recording
   */
  async setLiveStreamRecording(liveStreamId: string, enable: boolean): Promise<any> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] ${enable ? 'Enabling' : 'Disabling'} recording for live stream ${liveStreamId}`,
      )

      // Update the live stream with the recording setting
      return await this.updateLiveStream(liveStreamId, {
        recording: enable,
      })
    } catch (error) {
      logError(error, 'MockMuxService.setLiveStreamRecording')
      throw new Error(`Failed to ${enable ? 'enable' : 'disable'} recording for mock live stream`)
    }
  }

  /**
   * Reset a live stream's stream key
   * @param liveStreamId Mux live stream ID
   */
  async resetStreamKey(liveStreamId: string): Promise<{ stream_key: string }> {
    try {
      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Resetting stream key for live stream ${liveStreamId}`,
      )

      // Check if the live stream exists
      if (!this._mockLiveStreams.has(liveStreamId)) {
        logger.info(
          { context: 'muxService' },
          `[MockMuxService] Live stream ${liveStreamId} not found`,
        )
        throw new Error(`Live stream ${liveStreamId} not found`)
      }

      // Generate a new mock stream key
      const newStreamKey = `mock-stream-key-${Date.now()}`

      // Update the live stream with the new stream key
      const liveStream = this._mockLiveStreams.get(liveStreamId)!
      liveStream.stream_key = newStreamKey
      this._mockLiveStreams.set(liveStreamId, liveStream)

      logger.info(
        { context: 'muxService' },
        `[MockMuxService] Successfully reset stream key for live stream ${liveStreamId}`,
      )

      return { stream_key: newStreamKey }
    } catch (error) {
      logError(error, 'MockMuxService.resetStreamKey')
      throw new Error('Failed to reset stream key for mock live stream')
    }
  }
}
