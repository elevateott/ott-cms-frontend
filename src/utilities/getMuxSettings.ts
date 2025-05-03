/**
 * Utility function to get Mux settings from global configuration
 * Falls back to environment variables if global settings are not available
 */

import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface MuxSettings {
  tokenId: string
  tokenSecret: string
  webhookSecret: string
  signingKeyId: string
  signingKeyPrivateKey: string
  drmConfigurationId: string
  defaultPlaybackPolicy: 'public' | 'signed'
  autoGenerateThumbnails: boolean
  enableDRMByDefault: boolean
  defaultDRMConfigurationId: string
}

/**
 * Get Mux settings from global configuration
 * Falls back to environment variables if global settings are not available
 */
export async function getMuxSettings(): Promise<MuxSettings> {
  try {
    // Get payload instance
    const payload = await getPayload({ config: configPromise })

    // Get streaming settings from globals
    const streamingSettings = await payload.findGlobal({
      slug: 'streaming-settings',
    })

    // Extract Mux settings
    const muxSettings = streamingSettings?.muxSettings || {}
    const apiCredentials = muxSettings?.apiCredentials || {}

    // Return settings with fallbacks to environment variables
    return {
      tokenId: apiCredentials.tokenId || process.env.MUX_TOKEN_ID || '',
      tokenSecret: apiCredentials.tokenSecret || process.env.MUX_TOKEN_SECRET || '',
      webhookSecret: apiCredentials.webhookSecret || process.env.MUX_WEBHOOK_SECRET || '',
      signingKeyId: apiCredentials.signingKeyId || process.env.MUX_SIGNING_KEY_ID || '',
      signingKeyPrivateKey:
        apiCredentials.signingKeyPrivateKey || process.env.MUX_SIGNING_KEY_PRIVATE_KEY || '',
      drmConfigurationId:
        apiCredentials.drmConfigurationId || process.env.MUX_DRM_CONFIGURATION_ID || '',
      defaultPlaybackPolicy: muxSettings.defaultPlaybackPolicy || 'public',
      autoGenerateThumbnails:
        muxSettings.autoGenerateThumbnails !== undefined
          ? muxSettings.autoGenerateThumbnails
          : true,
      enableDRMByDefault: muxSettings.enableDRMByDefault || false,
      defaultDRMConfigurationId:
        muxSettings.defaultDRMConfigurationId ||
        apiCredentials.drmConfigurationId ||
        process.env.MUX_DRM_CONFIGURATION_ID ||
        '',
    }
  } catch (error) {
    logger.error({ context: 'getMuxSettings' }, 'Error getting Mux settings from globals:', error)

    // Fall back to environment variables
    return {
      tokenId: process.env.MUX_TOKEN_ID || '',
      tokenSecret: process.env.MUX_TOKEN_SECRET || '',
      webhookSecret: process.env.MUX_WEBHOOK_SECRET || '',
      signingKeyId: process.env.MUX_SIGNING_KEY_ID || '',
      signingKeyPrivateKey: process.env.MUX_SIGNING_KEY_PRIVATE_KEY || '',
      drmConfigurationId: process.env.MUX_DRM_CONFIGURATION_ID || '',
      defaultPlaybackPolicy: 'public',
      autoGenerateThumbnails: true,
      enableDRMByDefault: false,
      defaultDRMConfigurationId: process.env.MUX_DRM_CONFIGURATION_ID || '',
    }
  }
}

/**
 * Get Mux settings synchronously (for client-side use)
 * Only uses environment variables
 */
export function getMuxSettingsSync(): MuxSettings {
  return {
    tokenId: process.env.MUX_TOKEN_ID || '',
    tokenSecret: process.env.MUX_TOKEN_SECRET || '',
    webhookSecret: process.env.MUX_WEBHOOK_SECRET || '',
    signingKeyId: process.env.MUX_SIGNING_KEY_ID || '',
    signingKeyPrivateKey: process.env.MUX_SIGNING_KEY_PRIVATE_KEY || '',
    drmConfigurationId: process.env.MUX_DRM_CONFIGURATION_ID || '',
    defaultPlaybackPolicy: 'public',
    autoGenerateThumbnails: true,
    enableDRMByDefault: false,
    defaultDRMConfigurationId: process.env.MUX_DRM_CONFIGURATION_ID || '',
  }
}
