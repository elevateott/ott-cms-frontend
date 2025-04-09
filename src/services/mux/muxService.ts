/**
 * Mux Service
 *
 * Handles all interactions with the Mux API
 */

import Mux from '@mux/mux-node'
import { muxConfig } from '@/config'
import { MuxUploadRequest, MuxUploadResponse, MuxAsset, MuxWebhookEvent } from '@/types/mux'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { logError } from '@/utils/errorHandler'

// We'll initialize the client lazily when needed
let muxClient: any = null
let Video: any = null

export class MuxService {
  constructor() {
    this.initializeClient()
  }

  /**
   * Initialize the Mux client
   */
  private initializeClient(): void {
    if (muxClient && Video) {
      return // Already initialized
    }

    try {
      muxClient = new Mux({
        tokenId: muxConfig.tokenId,
        tokenSecret: muxConfig.tokenSecret,
      })

      Video = muxClient.Video

      if (!Video) {
        console.error('Failed to initialize Mux Video client')
      }
    } catch (error) {
      console.error('Error initializing Mux client:', error)
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
      // Set default options
      const defaultOptions: MuxUploadRequest = {
        corsOrigin: '*',
        newAssetSettings: {
          playbackPolicy: ['public'],
        },
      }

      // Merge with provided options
      const mergedOptions = { ...defaultOptions, ...options }

      // Check if Video client is initialized
      if (!Video || !Video.Uploads) {
        throw new Error('Mux Video client not properly initialized')
      }

      // Create the upload
      const upload = await Video.Uploads.create(mergedOptions)

      return {
        uploadId: upload.id,
        url: upload.url,
      }
    } catch (error) {
      logError(error, 'MuxService.createDirectUpload')
      throw new Error('Failed to create Mux direct upload')
    }
  }

  /**
   * Get asset details
   */
  async getAsset(assetId: string): Promise<MuxAsset | null> {
    try {
      const asset = await Video.Assets.get(assetId)
      return asset as unknown as MuxAsset
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
      await Video.Assets.del(assetId)
      return true
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
      // Parse the signature header
      // Format is: t=timestamp,v1=signature
      const [timestampPart, signaturePart] = signature.split(',')

      if (!timestampPart || !signaturePart) {
        return false
      }

      const timestamp = timestampPart.replace('t=', '')
      const receivedSignature = signaturePart.replace('v1=', '')

      // Create the string to sign (timestamp + '.' + body)
      const stringToSign = `${timestamp}.${body}`

      // Generate the HMAC signature
      const hmac = crypto.createHmac('sha256', muxConfig.webhookSecret)
      hmac.update(stringToSign)
      const calculatedSignature = hmac.digest('hex')

      // Compare signatures
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
      const {
        expiresIn = 3600, // 1 hour
        tokenType = 'jwt',
        keyId = muxConfig.signingKeyId,
        keySecret = muxConfig.signingKeyPrivateKey,
      } = options

      // Calculate expiration time
      const expirationTime = Math.floor(Date.now() / 1000) + expiresIn

      // Create the JWT payload
      const payload = {
        sub: playbackId,
        exp: expirationTime,
        aud: 'v',
      }

      // Sign the JWT
      const token = jwt.sign(payload, keySecret, {
        algorithm: 'RS256',
        keyid: keyId,
      })

      // Return the signed URL
      return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`
    } catch (error) {
      logError(error, 'MuxService.generateSignedPlaybackUrl')
      throw new Error('Failed to generate signed playback URL')
    }
  }
}
