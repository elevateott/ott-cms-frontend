/**
 * Mux Utilities
 *
 * This file provides utility functions for working with Mux.
 * These functions ensure the MuxService is properly initialized before use.
 */

import { createMuxService } from '@/services/mux'
import { MuxAsset } from '@/types/mux'
import { getMuxSettings } from '@/utilities/getMuxSettings'
import { logger } from '@/utils/logger'

// Initialize the Mux service
const getMuxService = async () => await createMuxService()

/**
 * Create a Mux upload
 */
export const createMuxUpload = async (options?: {
  metadata?: Record<string, string>
  passthrough?: Record<string, string>
  enableDRM?: boolean
}) => {
  const muxService = await getMuxService()
  const muxSettings = await getMuxSettings()

  // If DRM is enabled, add the DRM configuration
  if (options?.enableDRM) {
    const drmConfigId = muxSettings.drmConfigurationId

    if (!drmConfigId) {
      logger.warn(
        { context: 'mux' },
        'DRM is enabled but no DRM configuration ID is set in global settings or environment variables',
      )
    } else {
      // Add DRM configuration to the upload options
      return muxService.createDirectUpload({
        ...options,
        newAssetSettings: {
          playbackPolicy: ['signed'], // DRM requires signed playback policy
          drm: {
            drmConfigurationIds: [drmConfigId],
          },
        },
      })
    }
  }

  // Default case without DRM
  return muxService.createDirectUpload(options)
}

/**
 * Get a Mux asset
 */
export const getMuxAsset = async (assetId: string): Promise<MuxAsset | null> => {
  const muxService = await getMuxService()
  return muxService.getAsset(assetId)
}

/**
 * Create a Mux thumbnail
 */
export const createMuxThumbnail = async (
  assetId: string,
  time: number = 0,
): Promise<{ url: string }> => {
  const muxService = await getMuxService()
  return muxService.createMuxThumbnail(assetId, time)
}

/**
 * Delete a Mux asset
 */
export const deleteMuxAsset = async (assetId: string): Promise<boolean> => {
  const muxService = await getMuxService()
  return muxService.deleteAsset(assetId)
}

/**
 * Delete all Mux assets
 */
export const deleteAllMuxAssets = async (): Promise<{
  success: boolean
  count: number
  failedCount: number
  totalCount: number
}> => {
  const muxService = await getMuxService()
  return muxService.deleteAllMuxAssets()
}

/**
 * Update a Mux asset with advanced properties
 */
export const updateMuxAsset = async (
  assetId: string,
  data: {
    playback_policy?: ('public' | 'signed')[]
    mp4_support?: 'none' | 'standard'
    encoding_tier?: 'basic' | 'plus' | 'premium'
    max_resolution_tier?: '1080p'
    normalize_audio?: boolean
    generated_subtitles?: { name: string; language_code: string }[]
  },
): Promise<any> => {
  const muxService = await getMuxService()
  return muxService.updateAsset(assetId, data)
}
