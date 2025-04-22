/**
 * Mux Service
 *
 * Handles all interactions with the Mux API
 */

import Mux from '@mux/mux-node'
import { MuxUploadRequest, MuxAsset, MuxWebhookEvent } from '@/types/mux'
import { logError } from '@/utils/errorHandler'
import { IMuxService } from '@/services/mux/IMuxService'
import { muxConfig } from '@/config'
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
      console.log('Creating Mux upload with options:', options)
      return await MuxService.getInstance().createDirectUpload(options)
    } catch (error) {
      console.error('Error creating Mux upload:', error)
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
      console.error(`Error fetching Mux asset ${assetId}:`, error)
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
      console.error(`Error creating Mux thumbnail for asset ${assetId}:`, error)
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
      console.error(`Error deleting Mux asset ${assetId}:`, error)
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
      console.error('Error deleting all Mux assets:', error)
      throw new Error('Failed to delete all Mux assets')
    }
  }
  private video: MuxVideoClient

  constructor({ tokenId, tokenSecret }: { tokenId: string; tokenSecret: string }) {
    if (!tokenId || !tokenSecret) {
      throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET are required')
    }

    console.log('Initializing Mux client with token ID:', tokenId.substring(0, 8) + '...')

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

      // Log available properties for debugging
      //console.log('Mux video client properties:', Object.keys(this.video))

      // Check for uploads property (could be lowercase or uppercase)
      const hasUploads = this.video.uploads || this.video.Uploads
      const hasAssets = this.video.assets || this.video.Assets

      if (!hasUploads) {
        console.warn('Mux Video client missing uploads property - uploads API may not be available')
      }

      if (!hasAssets) {
        console.warn('Mux Video client missing assets property - assets API may not be available')
      }

      console.log('Mux Video client initialized successfully')
    } catch (error) {
      console.error('Error initializing Mux client:', error)
      throw new Error(
        `Failed to initialize Mux Video client: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Create a direct upload URL
   */
  async createDirectUpload(options: MuxUploadRequest = {}): Promise<{
    uploadId: string
    url: string
  }> {
    try {
      console.log('MuxService.createDirectUpload called with options:', options)

      // Check if video.uploads exists (lowercase 'u')
      if (this.video.uploads) {
        console.log('Using video.uploads.create')
        const uploadOptions = {
          cors_origin: '*',
          new_asset_settings: {
            playback_policy: ['public'],
          },
          ...options,
        }
        console.log('Upload options:', uploadOptions)

        const upload = await this.video.uploads.create(uploadOptions)
        console.log('Upload created successfully:', { id: upload.id })

        return {
          uploadId: upload.id,
          url: upload.url,
        }
      }
      // Fallback to video.Uploads if it exists (capital 'U')
      else if (this.video.Uploads) {
        console.log('Using video.Uploads.create')
        const uploadOptions = {
          cors_origin: '*',
          new_asset_settings: {
            playback_policy: ['public'],
          },
          ...options,
        }
        console.log('Upload options:', uploadOptions)

        const upload = await this.video.Uploads.create(uploadOptions)
        console.log('Upload created successfully:', { id: upload.id })

        return {
          uploadId: upload.id,
          url: upload.url,
        }
      }
      // Log error if neither exists
      else {
        console.error('Mux video client is missing uploads property', this.video)
        throw new Error('Mux video client is missing uploads property')
      }
    } catch (error) {
      console.error('Error in MuxService.createDirectUpload:', error)
      logError(error, 'MuxService.createDirectUpload')
      throw error
    }
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
    console.log(`getAsset called for ${assetId} from:`, stack?.split('\n')[2])

    const cacheKey = `asset:${assetId}`

    // Check if we have a cached result that's still valid
    const cachedAsset = MuxService.cachedAssets.get(cacheKey)
    if (cachedAsset && Date.now() - cachedAsset.timestamp < MuxService.CACHE_TTL) {
      console.log(
        `Using cached data for Mux asset ${assetId} (age: ${Date.now() - cachedAsset.timestamp}ms)`,
      )
      return cachedAsset.data
    }

    // If there's already a pending request for this asset, return that promise
    if (MuxService.pendingRequests.has(cacheKey)) {
      console.log(`Using pending request for Mux asset ${assetId}`)
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
      console.log(`Cleared cache for Mux asset ${assetId}`)
    } else {
      MuxService.cachedAssets.clear()
      console.log('Cleared all Mux asset cache')
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
        console.log(`Rate limiting: Waiting ${delay}ms before fetching Mux asset ${assetId}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      console.log(`Fetching Mux asset ${assetId}`)

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
      console.log(`Fetching up to ${limit} Mux assets for deletion`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        console.log(`Rate limiting: Waiting ${delay}ms before fetching Mux assets`)
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
        console.log('No assets found or invalid response format')
        return []
      }

      if (!Array.isArray(response.data)) {
        console.log('Invalid response format - expected an array')
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

      console.log(`Found ${assets.length} Mux assets to delete`)
      return assets
    } catch (error) {
      console.error('Error fetching all Mux assets:', error)
      logError(error, 'MuxService.getAllAssets')
      return []
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      console.log(`Deleting Mux asset ${assetId}...`)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - MuxService.lastRequestTime
      if (timeSinceLastRequest < MuxService.MIN_REQUEST_INTERVAL) {
        const delay = MuxService.MIN_REQUEST_INTERVAL - timeSinceLastRequest
        console.log(`Rate limiting: Waiting ${delay}ms before deleting Mux asset ${assetId}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      MuxService.lastRequestTime = Date.now()

      // First try using the SDK methods if available
      if (this.video.assets && typeof this.video.assets.del === 'function') {
        console.log(`Using video.assets.del for asset ${assetId}`)
        await this.video.assets.del(assetId)
        console.log(`Successfully deleted Mux asset ${assetId} using SDK method`)
        return true
      }
      // Fallback to video.Assets if it exists (capital 'A')
      else if (this.video.Assets && typeof this.video.Assets.del === 'function') {
        console.log(`Using video.Assets.del for asset ${assetId}`)
        await this.video.Assets.del(assetId)
        console.log(`Successfully deleted Mux asset ${assetId} using SDK method`)
        return true
      }
      // Fallback to direct API call if SDK methods are not available
      else {
        console.log(`Using direct API call for deleting asset ${assetId}`)
        await this.video._client.delete(`/video/v1/assets/${assetId}`)
        console.log(`Successfully deleted Mux asset ${assetId} using direct API call`)
        return true
      }
    } catch (error) {
      console.error(`Error deleting Mux asset ${assetId}:`, error)
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
  verifyWebhookSignature(signature: string, body: string): boolean {
    try {
      if (!muxConfig.webhookSecret) {
        throw new Error('MUX_WEBHOOK_SECRET is required for webhook verification')
      }

      // Mux signatures are in the format "t=timestamp,v1=signature"
      const [timestampPart, signaturePart] = signature.split(',')
      if (!timestampPart || !signaturePart) {
        console.error('Invalid signature format')
        return false
      }

      const timestamp = timestampPart.replace('t=', '')
      const receivedSignature = signaturePart.replace('v1=', '')

      // Create the string to sign (timestamp + '.' + body)
      const stringToSign = `${timestamp}.${body}`

      // Calculate HMAC
      const calculatedSignature = crypto
        .createHmac('sha256', muxConfig.webhookSecret)
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
      // Extract options with defaults
      const expiresIn = options.expiresIn || 3600 // 1 hour default
      // tokenType is not used but kept in the interface for API compatibility
      const keyId = options.keyId || muxConfig.signingKeyId
      const keySecret = options.keySecret || muxConfig.signingKeyPrivateKey

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
      console.error(`Error creating Mux thumbnail for asset ${assetId}:`, error)
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

      console.log(`Processing ${assets.length} assets for deletion`)

      // Log the first few asset IDs to avoid overwhelming the console
      const assetIdsToLog = assets.slice(0, 10).map((asset) => asset.id)
      console.log(`Asset IDs to delete: ${assetIdsToLog.join(', ')}`)
      if (assets.length > 10) {
        console.log(`...and ${assets.length - 10} more assets`)
      }

      // Delete assets in batches to avoid overwhelming the system
      const results: Array<{ status: string; value?: boolean; reason?: Error | unknown }> = []
      const BATCH_SIZE = 20

      // Process assets in batches
      for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        const batch = assets.slice(i, i + BATCH_SIZE)
        console.log(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(assets.length / BATCH_SIZE)} (${batch.length} assets)`,
        )

        // Process each asset in the batch sequentially
        for (const asset of batch) {
          console.log(`Deleting asset ${asset.id}...`)
          try {
            const success = await this.deleteAsset(asset.id)
            results.push({ status: 'fulfilled', value: success })
            console.log(`Asset ${asset.id} deletion ${success ? 'succeeded' : 'failed'}`)
          } catch (error) {
            console.error(`Error deleting asset ${asset.id}:`, error)
            results.push({ status: 'rejected', reason: error })
          }
        }

        // Add a shorter delay between batches to avoid overwhelming the API
        if (i + BATCH_SIZE < assets.length) {
          console.log('Short pause between batches to avoid rate limiting...')
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      // Count successful deletions
      const successCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value,
      ).length
      const failureCount = results.length - successCount

      console.log(
        `Batch deletion complete. Successfully deleted ${successCount} Mux assets, failed to delete ${failureCount}`,
      )

      return {
        results,
        successCount,
        failureCount,
        totalCount: assets.length,
      }
    } catch (error) {
      console.error('Error in deleteBatchOfAssets:', error)
      throw error
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
        console.log(
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

      console.log(`Starting deletion of all Mux assets... (recursion depth: ${recursionDepth})`)
      console.log(
        `Current totals: ${currentResults.successCount} deleted, ${currentResults.failureCount} failed, ${currentResults.totalCount} processed`,
      )

      // Get all assets from Mux with pagination
      console.log('Fetching Mux assets...')
      const assets = await this.getAllAssets()
      console.log(`Fetch complete. Found ${assets.length} Mux assets.`)

      if (assets.length === 0) {
        console.log('No more Mux assets found to delete')
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

      console.log(
        `Running totals: ${updatedResults.successCount} deleted, ${updatedResults.failureCount} failed, ${updatedResults.totalCount} processed`,
      )

      // Check if we're making progress before recursing
      if (assets.length > 0 && batchResults.successCount > 0) {
        console.log(
          `Successfully deleted ${batchResults.successCount} assets, checking for more...`,
        )
        // Add a delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return this.deleteAllMuxAssets(updatedResults, recursionDepth + 1)
      } else if (assets.length > 0 && batchResults.successCount === 0) {
        // We found assets but couldn't delete any - avoid infinite recursion
        console.log(
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
      console.error('Error deleting all Mux assets:', error)
      throw new Error('Failed to delete all Mux assets')
    }
  }
}
