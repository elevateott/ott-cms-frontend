import { logger } from '@/utils/logger'
/**
 * Mux Service
 *
 * Handles all interactions with the Mux API
 */

import Mux from '@mux/mux-node'
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
import { getMuxSettings, getMuxSettingsSync, MuxSettings } from '@/utilities/getMuxSettings'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

// Define a type for the Mux Video client
interface MuxVideoClient {
  assets?: {
    get: (assetId: string) => Promise<any>
    del: (assetId: string) => Promise<void>
  }
  Assets?: {
    get: (assetId: string) => Promise<any>
    del: (assetId: string) => Promise<void>
  }
  uploads?: {
    create: (options: any) => Promise<any>
  }
  Uploads?: {
    create: (options: any) => Promise<any>
  }
  [key: string]: any // Allow other properties
}

export class MuxService implements IMuxService {
  // Static instance for utility methods
  private static instance: MuxService | null = null

  /**
   * Get the singleton instance of MuxService
   */
  private static getInstance(): MuxService {
    if (!MuxService.instance) {
      throw new Error('MuxService not initialized. Call createMuxService() first.')
    }
    return MuxService.instance
  }

  /**
   * Set the singleton instance
   */
  static setInstance(instance: MuxService): void {
    MuxService.instance = instance
  }

  /**
   * Create a Mux upload (static utility method)
   */
  static async createMuxUpload(options?: {
    metadata?: Record<string, string>
    passthrough?: Record<string, string>
  }): Promise<{ uploadId: string; url: string }> {
    try {
      logger.info({ context: 'muxService' }, 'Creating Mux upload with options:', options)
      return await MuxService.getInstance().createDirectUpload(options)
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error creating Mux upload:', error)
      throw error
    }
  }

  /**
   * Get a Mux asset (static utility method)
   */
  static async getMuxAsset(assetId: string): Promise<MuxAsset | null> {
    try {
      return await MuxService.getInstance().getAsset(assetId)
    } catch (error) {
      logger.error({ context: 'muxService' }, `Error fetching Mux asset ${assetId}:`, error)
      throw new Error('Failed to fetch Mux asset')
    }
  }

  /**
   * Create a Mux thumbnail (static utility method)
   */
  static async createMuxThumbnail(assetId: string, time: number = 0): Promise<{ url: string }> {
    try {
      return await MuxService.getInstance().createMuxThumbnail(assetId, time)
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error creating Mux thumbnail for asset ${assetId}:`,
        error,
      )
      throw new Error('Failed to create Mux thumbnail')
    }
  }

  /**
   * Delete a Mux asset (static utility method)
   */
  static async deleteMuxAsset(assetId: string): Promise<boolean> {
    try {
      return await MuxService.getInstance().deleteAsset(assetId)
    } catch (error) {
      logger.error({ context: 'muxService' }, `Error deleting Mux asset ${assetId}:`, error)
      throw new Error('Failed to delete Mux asset')
    }
  }

  /**
   * Delete all Mux assets (static utility method)
   * @param previousResults Optional results from previous recursive calls
   * @param recursionDepth Current recursion depth to prevent infinite loops
   */
  static async deleteAllMuxAssets(
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
      return await MuxService.getInstance().deleteAllMuxAssets(previousResults, recursionDepth)
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error deleting all Mux assets:', error)
      throw new Error('Failed to delete all Mux assets')
    }
  }
  private video: MuxVideoClient

  constructor({ tokenId, tokenSecret }: { tokenId: string; tokenSecret: string }) {
    if (!tokenId || !tokenSecret) {
      throw new Error('Mux API credentials are required')
    }

    logger.info(
      { context: 'muxService' },
      'Initializing Mux client with token ID:',
      tokenId.substring(0, 8) + '...',
    )

    try {
      const muxClient = new Mux({
        tokenId,
        tokenSecret,
      })

      // Store the video client
      this.video = muxClient.video as unknown as MuxVideoClient // Cast to our interface

      // Add validation with better error messaging
      if (!this.video) {
        throw new Error('Mux Video client initialization failed - video object is undefined')
      }

      // Check for uploads property (could be lowercase or uppercase)
      const hasUploads = this.video.uploads || this.video.Uploads
      const hasAssets = this.video.assets || this.video.Assets

      if (!hasUploads) {
        logger.warn(
          { context: 'muxService' },
          'Mux Video client missing uploads property - uploads API may not be available',
        )
      }

      if (!hasAssets) {
        logger.warn(
          { context: 'muxService' },
          'Mux Video client missing assets property - assets API may not be available',
        )
      }

      logger.info({ context: 'muxService' }, 'Mux Video client initialized successfully')
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error initializing Mux client:', error)
      throw new Error(
        `Failed to initialize Mux Video client: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Create a direct upload URL with retry logic
   */
  async createDirectUpload(options: MuxUploadRequest = {}): Promise<{
    uploadId: string
    url: string
  }> {
    const MAX_RETRIES = 3
    let retryCount = 0
    let lastError: Error | null = null

    while (retryCount < MAX_RETRIES) {
      try {
        logger.info(
          { context: 'muxService' },
          `MuxService.createDirectUpload attempt ${retryCount + 1}/${MAX_RETRIES} with options:`,
          options,
        )

        // Prepare new asset settings with DRM if enabled
        const newAssetSettings = {
          playback_policy: options.newAssetSettings?.playbackPolicy || ['public'],
        } as any

        // If DRM is enabled, add DRM configuration and ensure playback policy is signed
        if (options.newAssetSettings?.drm?.drmConfigurationIds?.length) {
          logger.info({ context: 'muxService' }, 'DRM is enabled for this upload')
          // Override playback policy to signed when DRM is enabled
          newAssetSettings.playback_policy = ['signed']
          // Add DRM configuration
          newAssetSettings.drm = {
            drm_configuration_ids: options.newAssetSettings.drm.drmConfigurationIds,
          }
        }

        // Check if video.uploads exists (lowercase 'u')
        if (this.video.uploads) {
          logger.info({ context: 'muxService' }, 'Using video.uploads.create')
          const uploadOptions = {
            cors_origin: '*',
            new_asset_settings: newAssetSettings,
            metadata: options.metadata,
            passthrough: options.passthrough,
          }
          logger.info({ context: 'muxService' }, 'Upload options:', uploadOptions)

          // Set a timeout for the API call
          const uploadPromise = this.video.uploads.create(uploadOptions)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Mux API call timed out after 30 seconds')), 30000)
          })

          const upload = (await Promise.race([uploadPromise, timeoutPromise])) as any
          logger.info({ context: 'muxService' }, 'Upload created successfully:', { id: upload.id })

          return {
            uploadId: upload.id,
            url: upload.url,
          }
        }
        // Fallback to video.Uploads if it exists (capital 'U')
        else if (this.video.Uploads) {
          logger.info({ context: 'muxService' }, 'Using video.Uploads.create')
          const uploadOptions = {
            cors_origin: '*',
            new_asset_settings: newAssetSettings,
            metadata: options.metadata,
            passthrough: options.passthrough,
          }
          logger.info({ context: 'muxService' }, 'Upload options:', uploadOptions)

          // Set a timeout for the API call
          const uploadPromise = this.video.Uploads.create(uploadOptions)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Mux API call timed out after 30 seconds')), 30000)
          })

          const upload = (await Promise.race([uploadPromise, timeoutPromise])) as any
          logger.info({ context: 'muxService' }, 'Upload created successfully:', { id: upload.id })

          return {
            uploadId: upload.id,
            url: upload.url,
          }
        }
        // Log error if neither exists
        else {
          logger.error(
            { context: 'muxService' },
            'Mux video client is missing uploads property',
            this.video,
          )
          throw new Error('Mux video client is missing uploads property')
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        logger.error(
          { context: 'muxService' },
          `Error in MuxService.createDirectUpload (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
          error,
        )

        // Check if this is a rate limiting or timeout error
        const errorMessage = lastError.message.toLowerCase()
        const shouldRetry =
          errorMessage.includes('timeout') ||
          errorMessage.includes('timed out') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('429') ||
          errorMessage.includes('too many requests')

        if (shouldRetry && retryCount < MAX_RETRIES - 1) {
          retryCount++
          const delay = 2000 * retryCount // Exponential backoff: 2s, 4s, 6s

          logger.warn(
            { context: 'muxService' },
            `Retrying createDirectUpload in ${delay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`,
          )

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          // Don't retry for other errors or if we've reached max retries
          logError(error, 'MuxService.createDirectUpload')
          throw lastError
        }
      }
    }

    // This should never be reached due to the throw in the loop,
    // but TypeScript requires a return value
    throw lastError || new Error('Failed to create direct upload after multiple attempts')
  }

  // Add rate limiting and caching for Mux API calls
  private static lastRequestTime = 0
  private static MIN_REQUEST_INTERVAL = 1000 // 1 second between requests
  private static pendingRequests = new Map<string, Promise<any>>()
  private static cachedAssets = new Map<string, { data: MuxAsset; timestamp: number }>()
  private static CACHE_TTL = 10000 // 10 seconds cache TTL

  /**
   * Get asset details with rate limiting and caching
   */
  async getAsset(assetId: string): Promise<MuxAsset | null> {
    // Get the call stack to identify where this is being called from
    const stack = new Error().stack
    logger.info(
      { context: 'muxService' },
      `getAsset called for ${assetId} from:`,
      stack?.split('\n')[2],
    )

    const cacheKey = `asset:${assetId}`

    // Check if we have a cached result that's still valid
    const cachedAsset = MuxService.cachedAssets.get(cacheKey)
    if (cachedAsset && Date.now() - cachedAsset.timestamp < MuxService.CACHE_TTL) {
      logger.info(
        { context: 'muxService' },
        `Using cached data for Mux asset ${assetId} (age: ${Date.now() - cachedAsset.timestamp}ms)`,
      )
      return cachedAsset.data
    }

    // If there's already a pending request for this asset, return that promise
    if (MuxService.pendingRequests.has(cacheKey)) {
      logger.info({ context: 'muxService' }, `Using pending request for Mux asset ${assetId}`)
      return MuxService.pendingRequests.get(cacheKey) as Promise<MuxAsset | null>
    }

    // Create a new request promise with rate limiting
    const requestPromise = this.executeGetAsset(assetId).then((result) => {
      // Cache the result if it's not null
      if (result) {
        MuxService.cachedAssets.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        })
      }
      return result
    })

    // Store the pending request
    MuxService.pendingRequests.set(cacheKey, requestPromise)

    // Remove the promise from the map when it resolves or rejects
    requestPromise.finally(() => {
      MuxService.pendingRequests.delete(cacheKey)
    })

    return requestPromise
  }

  /**
   * Clear the cache for a specific asset or all assets
   */
  clearAssetCache(assetId?: string): void {
    if (assetId) {
      const cacheKey = `asset:${assetId}`
      MuxService.cachedAssets.delete(cacheKey)
      logger.info({ context: 'muxService' }, `Cleared cache for Mux asset ${assetId}`)
    } else {
      MuxService.cachedAssets.clear()
      logger.info({ context: 'muxService' }, 'Cleared all Mux asset cache')
    }
  }

  /**
   * Execute the get asset request with rate limiting
   */
  private async executeGetAsset(assetId: string): Promise<MuxAsset | null> {
    try {
      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before fetching Mux asset ${assetId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      logger.info({ context: 'muxService' }, `Fetching Mux asset ${assetId}`)

      // Get the asset directly using the assetId
      const response = await this.video._client.get(`/video/v1/assets/${assetId}`)

      if (!response) {
        return null
      }

      // Transform the response into our MuxAsset type
      return {
        id: response.id,
        playbackIds: response.playback_ids,
        status: response.status,
        duration: response.duration,
        aspectRatio: response.aspect_ratio,
        maxResolution: response.max_resolution,
        maxStoredResolution: response.max_stored_resolution,
        uploadId: response.upload_id,
        createdAt: response.created_at,
        tracks: response.tracks,
      } as MuxAsset
    } catch (error) {
      logError(error, 'MuxService.getAsset')
      return null
    }
  }

  /**
   * Get a limited number of assets for deletion
   * @param limit Maximum number of assets to return
   */
  async getAllAssets(limit: number = 100): Promise<MuxAsset[]> {
    try {
      logger.info({ context: 'muxService' }, `Fetching up to ${limit} Mux assets for deletion`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before fetching Mux assets`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Get assets directly with a single request and a reasonable limit
      const response = await this.video._client.get('/video/v1/assets', {
        params: {
          limit,
          page: 1, // Always start with page 1
        },
      })

      if (!response || !response.data) {
        logger.info({ context: 'muxService' }, 'No assets found or invalid response format')
        return []
      }

      if (!Array.isArray(response.data)) {
        logger.info({ context: 'muxService' }, 'Invalid response format - expected an array')
        return []
      }

      const assets = response.data.map((asset: any) => ({
        id: asset.id,
        playbackIds: asset.playback_ids,
        status: asset.status,
        duration: asset.duration,
        aspectRatio: asset.aspect_ratio,
        maxResolution: asset.max_resolution,
        maxStoredResolution: asset.max_stored_resolution,
        uploadId: asset.upload_id,
        createdAt: asset.created_at,
        tracks: asset.tracks,
      })) as MuxAsset[]

      logger.info({ context: 'muxService' }, `Found ${assets.length} Mux assets to delete`)
      return assets
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error fetching all Mux assets:', error)
      logError(error, 'MuxService.getAllAssets')
      return []
    }
  }

  /**
   * Update an asset
   */
  async updateAsset(assetId: string, data: any): Promise<any> {
    try {
      logger.info({ context: 'muxService' }, `Updating Mux asset ${assetId} with data:`, data)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before updating Mux asset ${assetId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Use direct API call to update the asset
      const response = await this.video._client.patch(`/video/v1/assets/${assetId}`, {
        data,
      })

      // Clear the cache for this asset to ensure fresh data on next fetch
      this.clearAssetCache(assetId)

      logger.info({ context: 'muxService' }, `Successfully updated Mux asset ${assetId}`)
      return response
    } catch (error) {
      logger.error({ context: 'muxService' }, `Error updating Mux asset ${assetId}:`, error)
      logError(error, 'MuxService.updateAsset')
      throw new Error(
        `Failed to update Mux asset: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      logger.info({ context: 'muxService' }, `Deleting Mux asset ${assetId}...`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before deleting Mux asset ${assetId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // First try using the SDK methods if available
      if (this.video.assets && typeof this.video.assets.del === 'function') {
        logger.info({ context: 'muxService' }, `Using video.assets.del for asset ${assetId}`)
        await this.video.assets.del(assetId)
        logger.info(
          { context: 'muxService' },
          `Successfully deleted Mux asset ${assetId} using SDK method`,
        )
        return true
      }
      // Fallback to video.Assets if it exists (capital 'A')
      else if (this.video.Assets && typeof this.video.Assets.del === 'function') {
        logger.info({ context: 'muxService' }, `Using video.Assets.del for asset ${assetId}`)
        await this.video.Assets.del(assetId)
        logger.info(
          { context: 'muxService' },
          `Successfully deleted Mux asset ${assetId} using SDK method`,
        )
        return true
      }
      // Fallback to direct API call if SDK methods are not available
      else {
        logger.info(
          { context: 'muxService' },
          `Using direct API call for deleting asset ${assetId}`,
        )
        await this.video._client.delete(`/video/v1/assets/${assetId}`)
        logger.info(
          { context: 'muxService' },
          `Successfully deleted Mux asset ${assetId} using direct API call`,
        )
        return true
      }
    } catch (error) {
      logger.error({ context: 'muxService' }, `Error deleting Mux asset ${assetId}:`, error)
      logError(error, 'MuxService.deleteAsset')
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

    let url = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=${fitMode}`

    if (time !== undefined) {
      url += `&time=${time}`
    }

    return url
  }

  /**
   * Verify a webhook signature
   */
  async verifyWebhookSignature(signature: string, body: string): Promise<boolean> {
    try {
      // Get Mux settings
      const muxSettings = await getMuxSettings()

      if (!muxSettings.webhookSecret) {
        throw new Error('Webhook secret is required for webhook verification')
      }

      // Mux signatures are in the format "t=timestamp,v1=signature"
      const [timestampPart, signaturePart] = signature.split(',')
      if (!timestampPart || !signaturePart) {
        logger.error({ context: 'muxService' }, 'Invalid signature format')
        return false
      }

      const timestamp = timestampPart.replace('t=', '')
      const receivedSignature = signaturePart.replace('v1=', '')

      // Create the string to sign (timestamp + '.' + body)
      const stringToSign = `${timestamp}.${body}`

      // Calculate HMAC
      const calculatedSignature = crypto
        .createHmac('sha256', muxSettings.webhookSecret)
        .update(stringToSign)
        .digest('hex')

      return receivedSignature === calculatedSignature
    } catch (error) {
      logError(error, 'MuxService.verifyWebhookSignature')
      return false
    }
  }

  /**
   * Parse a webhook event
   */
  parseWebhookEvent(body: string): MuxWebhookEvent | null {
    try {
      return JSON.parse(body) as MuxWebhookEvent
    } catch (error) {
      logError(error, 'MuxService.parseWebhookEvent')
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

    return `https://image.mux.com/${playbackId}/storyboard.jpg?width=${width}&height=${height}&fit_mode=${fitMode}`
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

    return `https://image.mux.com/${playbackId}/animated.gif?width=${width}&height=${height}&fit_mode=${fitMode}&time=${time}&duration=${duration}`
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
      // Get Mux settings
      const muxSettings = await getMuxSettings()

      // Extract options with defaults
      const expiresIn = options.expiresIn || 3600 // 1 hour default
      // tokenType is not used but kept in the interface for API compatibility
      const keyId = options.keyId || muxSettings.signingKeyId
      const keySecret = options.keySecret || muxSettings.signingKeyPrivateKey

      if (!keyId || !keySecret) {
        throw new Error('Signing key ID and private key are required for signed playback URLs')
      }

      // Calculate expiration time
      const expirationTime = Math.floor(Date.now() / 1000) + expiresIn

      // Create the JWT payload
      const payload = {
        sub: playbackId,
        exp: expirationTime,
        aud: 'v',
      }

      // Sign the JWT
      // Note: 'keyid' is the correct property name for the JWT library
      // even though TypeScript shows it as unknown
      const token = jwt.sign(payload, keySecret, {
        algorithm: 'RS256',
        keyid: keyId, // This is the correct property name for the JWT library
      } as any)

      // Return the signed URL
      return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
    } catch (error) {
      logError(error, 'MuxService.generateSignedPlaybackUrl')
      throw new Error('Failed to generate signed playback URL')
    }
  }

  /**
   * Create a Mux thumbnail for an asset
   */
  async createMuxThumbnail(assetId: string, time: number = 0): Promise<{ url: string }> {
    try {
      // Get the asset
      const asset = await this.getAsset(assetId)
      if (!asset) {
        throw new Error('Asset not found')
      }

      const playbackId = asset.playbackIds?.[0]?.id

      if (!playbackId) {
        throw new Error('No playback ID found for asset')
      }

      // Return the thumbnail URL
      const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`

      return { url: thumbnailUrl }
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error creating Mux thumbnail for asset ${assetId}:`,
        error,
      )
      throw new Error('Failed to create Mux thumbnail')
    }
  }

  /**
   * Helper function to delete a batch of Mux assets
   * @param assets Array of Mux assets to delete
   * @returns Results of the deletion operation
   */
  private async deleteBatchOfAssets(assets: MuxAsset[]): Promise<{
    results: Array<{ status: string; value?: boolean; reason?: Error | unknown }>
    successCount: number
    failureCount: number
    totalCount: number
  }> {
    try {
      if (assets.length === 0) {
        return { results: [], successCount: 0, failureCount: 0, totalCount: 0 }
      }

      logger.info({ context: 'muxService' }, `Processing ${assets.length} assets for deletion`)

      // Log the first few asset IDs to avoid overwhelming the console
      const assetIdsToLog = assets.slice(0, 10).map((asset) => asset.id)
      logger.info({ context: 'muxService' }, `Asset IDs to delete: ${assetIdsToLog.join(', ')}`)
      if (assets.length > 10) {
        logger.info({ context: 'muxService' }, `...and ${assets.length - 10} more assets`)
      }

      // Delete assets in batches to avoid overwhelming the system
      const results: Array<{ status: string; value?: boolean; reason?: Error | unknown }> = []
      const BATCH_SIZE = 20

      // Process assets in batches
      for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        const batch = assets.slice(i, i + BATCH_SIZE)
        logger.info(
          { context: 'muxService' },
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(assets.length / BATCH_SIZE)} (${batch.length} assets)`,
        )

        // Process each asset in the batch sequentially
        for (const asset of batch) {
          logger.info({ context: 'muxService' }, `Deleting asset ${asset.id}...`)
          try {
            const success = await this.deleteAsset(asset.id)
            results.push({ status: 'fulfilled', value: success })
            logger.info(
              { context: 'muxService' },
              `Asset ${asset.id} deletion ${success ? 'succeeded' : 'failed'}`,
            )
          } catch (error) {
            logger.error({ context: 'muxService' }, `Error deleting asset ${asset.id}:`, error)
            results.push({ status: 'rejected', reason: error })
          }
        }

        // Add a shorter delay between batches to avoid overwhelming the API
        if (i + BATCH_SIZE < assets.length) {
          logger.info(
            { context: 'muxService' },
            'Short pause between batches to avoid rate limiting...',
          )
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      // Count successful deletions
      const successCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value,
      ).length
      const failureCount = results.length - successCount

      logger.info(
        { context: 'muxService' },
        `Batch deletion complete. Successfully deleted ${successCount} Mux assets, failed to delete ${failureCount}`,
      )

      return {
        results,
        successCount,
        failureCount,
        totalCount: assets.length,
      }
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error in deleteBatchOfAssets:', error)
      throw error
    }
  }

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
        `Creating subtitle track for asset ${assetId} with language ${subtitleData.language}`,
      )

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before creating subtitle track`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Prepare the request data
      const data = {
        url: fileUrl,
        type: 'text',
        text_type: subtitleData.type || 'subtitles',
        language_code: subtitleData.language,
        name: subtitleData.name || subtitleData.language,
        closed_captions: subtitleData.closedCaptions || false,
      }

      // Create the track using the Mux API
      const response = await this.video._client.post(`/video/v1/assets/${assetId}/tracks`, {
        data,
      })

      // Clear the cache for this asset to ensure fresh data on next fetch
      this.clearAssetCache(assetId)

      logger.info(
        { context: 'muxService' },
        `Successfully created subtitle track for asset ${assetId}`,
        response,
      )

      return {
        id: response.id,
        url: response.url,
      }
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error creating subtitle track for asset ${assetId}:`,
        error,
      )
      logError(error, 'MuxService.createSubtitleTrack')
      throw new Error(
        `Failed to create subtitle track: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Get all subtitle tracks for a Mux asset
   * @param assetId Mux asset ID
   */
  async getSubtitleTracks(assetId: string): Promise<MuxTrack[]> {
    try {
      logger.info({ context: 'muxService' }, `Getting subtitle tracks for asset ${assetId}`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before getting subtitle tracks`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Get the asset to retrieve its tracks
      const asset = await this.getAsset(assetId)
      if (!asset) {
        throw new Error(`Asset ${assetId} not found`)
      }

      // Filter for text tracks only
      const textTracks = asset.tracks?.filter((track) => track.type === 'text') || []

      logger.info(
        { context: 'muxService' },
        `Found ${textTracks.length} text tracks for asset ${assetId}`,
      )

      return textTracks
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error getting subtitle tracks for asset ${assetId}:`,
        error,
      )
      logError(error, 'MuxService.getSubtitleTracks')
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
        `Deleting subtitle track ${trackId} from asset ${assetId}`,
      )

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before deleting subtitle track`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Delete the track using the Mux API
      await this.video._client.delete(`/video/v1/assets/${assetId}/tracks/${trackId}`)

      // Clear the cache for this asset to ensure fresh data on next fetch
      this.clearAssetCache(assetId)

      logger.info(
        { context: 'muxService' },
        `Successfully deleted subtitle track ${trackId} from asset ${assetId}`,
      )

      return true
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error deleting subtitle track ${trackId} from asset ${assetId}:`,
        error,
      )
      logError(error, 'MuxService.deleteSubtitleTrack')
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
        `Generating auto-captions for asset ${assetId} in language ${language}`,
      )

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before generating auto-captions`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Generate auto-captions using the Mux API
      const response = await this.video._client.post(
        `/video/v1/assets/${assetId}/generate-subtitles`,
        {
          data: {
            generated_subtitles: [
              {
                name: language === 'en' ? 'English' : language,
                language_code: language,
              },
            ],
          },
        },
      )

      // Clear the cache for this asset to ensure fresh data on next fetch
      this.clearAssetCache(assetId)

      logger.info(
        { context: 'muxService' },
        `Successfully requested auto-captions for asset ${assetId}`,
        response,
      )

      return {
        id: response.id || 'pending',
      }
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error generating auto-captions for asset ${assetId}:`,
        error,
      )
      logError(error, 'MuxService.generateAutoCaptions')
      throw new Error(
        `Failed to generate auto-captions: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Delete all Mux assets recursively
   * @param previousResults Optional results from previous recursive calls
   * @param recursionDepth Current recursion depth to prevent infinite loops
   * @returns Results of the deletion operation
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
      // Maximum recursion depth to prevent infinite loops
      const MAX_RECURSION_DEPTH = 20

      // Check if we've reached the maximum recursion depth
      if (recursionDepth >= MAX_RECURSION_DEPTH) {
        logger.info(
          { context: 'muxService' },
          `Maximum recursion depth (${MAX_RECURSION_DEPTH}) reached. Stopping to prevent infinite loops.`,
        )
        return {
          success: true,
          count: previousResults?.successCount || 0,
          failedCount: previousResults?.failureCount || 0,
          totalCount: previousResults?.totalCount || 0,
        }
      }

      // Initialize results if this is the first call
      const currentResults = previousResults || {
        successCount: 0,
        failureCount: 0,
        totalCount: 0,
      }

      logger.info(
        { context: 'muxService' },
        `Starting deletion of all Mux assets... (recursion depth: ${recursionDepth})`,
      )
      logger.info(
        { context: 'muxService' },
        `Current totals: ${currentResults.successCount} deleted, ${currentResults.failureCount} failed, ${currentResults.totalCount} processed`,
      )

      // Get all assets from Mux with pagination
      logger.info({ context: 'muxService' }, 'Fetching Mux assets...')
      const assets = await this.getAllAssets()
      logger.info({ context: 'muxService' }, `Fetch complete. Found ${assets.length} Mux assets.`)

      if (assets.length === 0) {
        logger.info({ context: 'muxService' }, 'No more Mux assets found to delete')
        return {
          success: true,
          count: currentResults.successCount,
          failedCount: currentResults.failureCount,
          totalCount: currentResults.totalCount,
        }
      }

      // Delete this batch of assets
      const batchResults = await this.deleteBatchOfAssets(assets)

      // Update the running totals
      const updatedResults = {
        successCount: currentResults.successCount + batchResults.successCount,
        failureCount: currentResults.failureCount + batchResults.failureCount,
        totalCount: currentResults.totalCount + batchResults.totalCount,
      }

      logger.info(
        { context: 'muxService' },
        `Running totals: ${updatedResults.successCount} deleted, ${updatedResults.failureCount} failed, ${updatedResults.totalCount} processed`,
      )

      // Check if we're making progress before recursing
      if (assets.length > 0 && batchResults.successCount > 0) {
        logger.info(
          { context: 'muxService' },
          `Successfully deleted ${batchResults.successCount} assets, checking for more...`,
        )
        // Add a delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return this.deleteAllMuxAssets(updatedResults, recursionDepth + 1)
      } else if (assets.length > 0 && batchResults.successCount === 0) {
        // We found assets but couldn't delete any - avoid infinite recursion
        logger.info(
          { context: 'muxService' },
          'Warning: Found assets but could not delete any. Stopping to avoid infinite recursion.',
        )
        return {
          success: true,
          count: updatedResults.successCount,
          failedCount: updatedResults.failureCount,
          totalCount: updatedResults.totalCount,
        }
      }

      // No more assets to delete
      return {
        success: true,
        count: updatedResults.successCount,
        failedCount: updatedResults.failureCount,
        totalCount: updatedResults.totalCount,
      }
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error deleting all Mux assets:', error)
      throw new Error('Failed to delete all Mux assets')
    }
  }

  /**
   * Create a Mux live stream
   * @param options Live stream options
   */
  async createLiveStream(options: MuxLiveStreamRequest = {}): Promise<MuxLiveStream> {
    try {
      logger.info({ context: 'muxService' }, 'Creating Mux live stream with options:', options)

      // Prepare the request body
      const requestBody: any = {
        playback_policy: options.playbackPolicy || ['public'],
        new_asset_settings: {
          playback_policy: options.newAssetSettings?.playbackPolicy || ['public'],
        },
      }

      // Add optional parameters if provided
      if (options.reconnectWindow !== undefined) {
        requestBody.reconnect_window = options.reconnectWindow
      }

      if (options.recording !== undefined) {
        requestBody.recording = options.recording
      }

      if (options.simulcastTargets && options.simulcastTargets.length > 0) {
        requestBody.simulcast_targets = options.simulcastTargets
      }

      // Make the API request
      const response = await this.video._client.post('/video/v1/live-streams', requestBody)

      if (!response || !response.data) {
        throw new Error('Invalid response from Mux API')
      }

      // Transform the response into our MuxLiveStream type with health data
      return {
        id: response.data.id,
        stream_key: response.data.stream_key,
        status: response.data.status,
        playback_ids: response.data.playback_ids,
        created_at: response.data.created_at,
        recording: response.data.recording,
        reconnect_window: response.data.reconnect_window,
        simulcast_targets: response.data.simulcast_targets,
        active_asset_id: response.data.active_asset_id,
        recent_asset_ids: response.data.recent_asset_ids,
        // Health data
        stream_health: response.data.stream_health,
        video_bitrate: response.data.video_bitrate,
        video_frame_rate: response.data.video_frame_rate,
        video_codec: response.data.video_codec,
        video_resolution: response.data.video_resolution,
        audio_bitrate: response.data.audio_bitrate,
        last_seen_time: response.data.last_seen_time,
        errors: response.data.errors,
        // Additional health metrics
        viewer_count: response.data.active_input_connection?.viewers,
        dropped_frames: response.data.dropped_frames,
        recent_input_video_bitrate: response.data.recent_input_video_bitrate,
        recent_input_video_frame_rate: response.data.recent_input_video_frame_rate,
        recent_input_audio_bitrate: response.data.recent_input_audio_bitrate,
        recent_input_height: response.data.recent_input_height,
        recent_input_width: response.data.recent_input_width,
        recent_input_last_seen: response.data.recent_input_last_seen,
        active_input_connection: response.data.active_input_connection,
      } as MuxLiveStream
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error creating Mux live stream:', error)
      throw new Error(
        `Failed to create Mux live stream: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Get a Mux live stream by ID
   * @param liveStreamId Mux live stream ID
   */
  async getLiveStream(liveStreamId: string): Promise<MuxLiveStream | null> {
    try {
      logger.info({ context: 'muxService' }, `Fetching Mux live stream ${liveStreamId}`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before fetching Mux live stream ${liveStreamId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Get the live stream directly using the liveStreamId
      const response = await this.video._client.get(`/video/v1/live-streams/${liveStreamId}`)

      if (!response || !response.data) {
        return null
      }

      // Transform the response into our MuxLiveStream type with health data
      return {
        id: response.data.id,
        stream_key: response.data.stream_key,
        status: response.data.status,
        playback_ids: response.data.playback_ids,
        created_at: response.data.created_at,
        recording: response.data.recording,
        reconnect_window: response.data.reconnect_window,
        simulcast_targets: response.data.simulcast_targets,
        active_asset_id: response.data.active_asset_id,
        recent_asset_ids: response.data.recent_asset_ids,
        // Health data
        stream_health: response.data.stream_health,
        video_bitrate: response.data.video_bitrate,
        video_frame_rate: response.data.video_frame_rate,
        video_codec: response.data.video_codec,
        video_resolution: response.data.video_resolution,
        audio_bitrate: response.data.audio_bitrate,
        last_seen_time: response.data.last_seen_time,
        errors: response.data.errors,
        // Additional health metrics
        viewer_count: response.data.active_input_connection?.viewers,
        dropped_frames: response.data.dropped_frames,
        recent_input_video_bitrate: response.data.recent_input_video_bitrate,
        recent_input_video_frame_rate: response.data.recent_input_video_frame_rate,
        recent_input_audio_bitrate: response.data.recent_input_audio_bitrate,
        recent_input_height: response.data.recent_input_height,
        recent_input_width: response.data.recent_input_width,
        recent_input_last_seen: response.data.recent_input_last_seen,
        active_input_connection: response.data.active_input_connection,
      } as MuxLiveStream
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error fetching Mux live stream ${liveStreamId}:`,
        error,
      )
      return null
    }
  }

  /**
   * Get all Mux live streams
   * @param limit Maximum number of live streams to return
   */
  async getAllLiveStreams(limit: number = 100): Promise<MuxLiveStream[]> {
    try {
      logger.info({ context: 'muxService' }, `Fetching up to ${limit} Mux live streams`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before fetching Mux live streams`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Get live streams directly with a single request and a reasonable limit
      const response = await this.video._client.get('/video/v1/live-streams', {
        params: {
          limit,
          page: 1, // Always start with page 1
        },
      })

      if (!response || !response.data) {
        logger.info({ context: 'muxService' }, 'No live streams found or invalid response format')
        return []
      }

      if (!Array.isArray(response.data)) {
        logger.info({ context: 'muxService' }, 'Invalid response format - expected an array')
        return []
      }

      const liveStreams = response.data.map((stream: any) => ({
        id: stream.id,
        stream_key: stream.stream_key,
        status: stream.status,
        playback_ids: stream.playback_ids,
        created_at: stream.created_at,
        recording: stream.recording,
        reconnect_window: stream.reconnect_window,
        simulcast_targets: stream.simulcast_targets,
        active_asset_id: stream.active_asset_id,
        recent_asset_ids: stream.recent_asset_ids,
        // Health data
        stream_health: stream.stream_health,
        video_bitrate: stream.video_bitrate,
        video_frame_rate: stream.video_frame_rate,
        video_codec: stream.video_codec,
        video_resolution: stream.video_resolution,
        audio_bitrate: stream.audio_bitrate,
        last_seen_time: stream.last_seen_time,
        errors: stream.errors,
        // Additional health metrics
        viewer_count: stream.active_input_connection?.viewers,
        dropped_frames: stream.dropped_frames,
        recent_input_video_bitrate: stream.recent_input_video_bitrate,
        recent_input_video_frame_rate: stream.recent_input_video_frame_rate,
        recent_input_audio_bitrate: stream.recent_input_audio_bitrate,
        recent_input_height: stream.recent_input_height,
        recent_input_width: stream.recent_input_width,
        recent_input_last_seen: stream.recent_input_last_seen,
        active_input_connection: stream.active_input_connection,
      })) as MuxLiveStream[]

      logger.info({ context: 'muxService' }, `Found ${liveStreams.length} Mux live streams`)
      return liveStreams
    } catch (error) {
      logger.error({ context: 'muxService' }, 'Error fetching Mux live streams:', error)
      return []
    }
  }

  /**
   * Delete a Mux live stream
   * @param liveStreamId Mux live stream ID
   */
  async deleteLiveStream(liveStreamId: string): Promise<boolean> {
    try {
      logger.info({ context: 'muxService' }, `Deleting Mux live stream ${liveStreamId}`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before deleting Mux live stream ${liveStreamId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Delete the live stream
      await this.video._client.delete(`/video/v1/live-streams/${liveStreamId}`)

      logger.info({ context: 'muxService' }, `Successfully deleted Mux live stream ${liveStreamId}`)
      return true
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error deleting Mux live stream ${liveStreamId}:`,
        error,
      )
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
      logger.info({ context: 'muxService' }, `Updating Mux live stream ${liveStreamId}:`, data)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before updating Mux live stream ${liveStreamId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Update the live stream
      const response = await this.video._client.put(`/video/v1/live-streams/${liveStreamId}`, data)

      logger.info({ context: 'muxService' }, `Successfully updated Mux live stream ${liveStreamId}`)
      return response.data
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error updating Mux live stream ${liveStreamId}:`,
        error,
      )
      throw new Error(
        `Failed to update Mux live stream: ${error instanceof Error ? error.message : String(error)}`,
      )
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
        `${enable ? 'Enabling' : 'Disabling'} recording for Mux live stream ${liveStreamId}`,
      )

      // Update the live stream with the recording setting
      return await this.updateLiveStream(liveStreamId, {
        recording: enable,
      })
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error ${enable ? 'enabling' : 'disabling'} recording for Mux live stream ${liveStreamId}:`,
        error,
      )
      throw new Error(
        `Failed to ${enable ? 'enable' : 'disable'} recording for Mux live stream: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
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
        `Resetting stream key for Mux live stream ${liveStreamId}`,
      )

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before resetting stream key for Mux live stream ${liveStreamId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Reset the stream key
      const response = await this.video._client.post(
        `/video/v1/live-streams/${liveStreamId}/reset-stream-key`,
      )

      logger.info(
        { context: 'muxService' },
        `Successfully reset stream key for Mux live stream ${liveStreamId}`,
      )
      return {
        stream_key: response.data.stream_key,
      }
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error resetting stream key for Mux live stream ${liveStreamId}:`,
        error,
      )
      throw new Error(
        `Failed to reset stream key for Mux live stream: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  /**
   * Disable a live stream
   * @param liveStreamId Mux live stream ID
   */
  async disableLiveStream(liveStreamId: string): Promise<boolean> {
    try {
      logger.info({ context: 'muxService' }, `Disabling Mux live stream ${liveStreamId}`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before disabling Mux live stream ${liveStreamId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Disable the live stream
      await this.video._client.put(`/video/v1/live-streams/${liveStreamId}/disable`)

      logger.info(
        { context: 'muxService' },
        `Successfully disabled Mux live stream ${liveStreamId}`,
      )
      return true
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error disabling Mux live stream ${liveStreamId}:`,
        error,
      )
      return false
    }
  }

  /**
   * Enable a live stream
   * @param liveStreamId Mux live stream ID
   */
  async enableLiveStream(liveStreamId: string): Promise<boolean> {
    try {
      logger.info({ context: 'muxService' }, `Enabling Mux live stream ${liveStreamId}`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before enabling Mux live stream ${liveStreamId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Enable the live stream
      await this.video._client.put(`/video/v1/live-streams/${liveStreamId}/enable`)

      logger.info({ context: 'muxService' }, `Successfully enabled Mux live stream ${liveStreamId}`)
      return true
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error enabling Mux live stream ${liveStreamId}:`,
        error,
      )
      return false
    }
  }

  /**
   * Complete a live stream (signal that the stream is finished)
   * @param liveStreamId Mux live stream ID
   */
  async completeLiveStream(liveStreamId: string): Promise<boolean> {
    try {
      logger.info({ context: 'muxService' }, `Completing Mux live stream ${liveStreamId}`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        logger.info(
          { context: 'muxService' },
          `Rate limiting: Waiting ${delay}ms before completing Mux live stream ${liveStreamId}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // Complete the live stream
      await this.video._client.put(`/video/v1/live-streams/${liveStreamId}/complete`)

      logger.info(
        { context: 'muxService' },
        `Successfully completed Mux live stream ${liveStreamId}`,
      )
      return true
    } catch (error) {
      logger.error(
        { context: 'muxService' },
        `Error completing Mux live stream ${liveStreamId}:`,
        error,
      )
      return false
    }
  }
}
