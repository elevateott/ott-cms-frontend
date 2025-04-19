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

  // Add rate limiting for Mux API calls
  private static lastRequestTime = 0
  private static MIN_REQUEST_INTERVAL = 1000 // 1 second between requests
  private static pendingRequests = new Map<string, Promise<any>>()

  /**
   * Get asset details with rate limiting
   */
  async getAsset(assetId: string): Promise<MuxAsset | null> {
    // If there's already a pending request for this asset, return that promise
    const cacheKey = `asset:${assetId}`
    if (MuxService.pendingRequests.has(cacheKey)) {
      console.log(`Using cached request for Mux asset ${assetId}`)
      return MuxService.pendingRequests.get(cacheKey) as Promise<MuxAsset | null>
    }

    // Create a new request promise with rate limiting
    const requestPromise = this.executeGetAsset(assetId)
    MuxService.pendingRequests.set(cacheKey, requestPromise)

    // Remove the promise from the map when it resolves or rejects
    requestPromise.finally(() => {
      MuxService.pendingRequests.delete(cacheKey)
    })

    return requestPromise
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
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      // Check if video.assets exists (lowercase 'a')
      if (this.video.assets) {
        await this.video.assets.del(assetId)
        return true
      }
      // Fallback to video.Assets if it exists (capital 'A')
      else if (this.video.Assets) {
        await this.video.Assets.del(assetId)
        return true
      }
      // Log error if neither exists
      else {
        console.error('Mux video client is missing assets property', this.video)
        return false
      }
    } catch (error) {
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
}
