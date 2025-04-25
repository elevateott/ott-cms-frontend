/**
 * Mux Utilities
 *
 * This file provides utility functions for working with Mux.
 * These functions ensure the MuxService is properly initialized before use.
 */

import { createMuxService } from '@/services/mux'
import { MuxAsset } from '@/types/mux'

// Initialize the Mux service
const getMuxService = () => createMuxService()

/**
 * Create a Mux upload
 */
export const createMuxUpload = async (options?: {
  metadata?: Record<string, string>
  passthrough?: Record<string, string>
}) => {
  const muxService = getMuxService()
  return muxService.createDirectUpload(options)
}

/**
 * Get a Mux asset
 */
export const getMuxAsset = async (assetId: string): Promise<MuxAsset | null> => {
  const muxService = getMuxService()
  return muxService.getAsset(assetId)
}

/**
 * Create a Mux thumbnail
 */
export const createMuxThumbnail = async (
  assetId: string,
  time: number = 0,
): Promise<{ url: string }> => {
  const muxService = getMuxService()
  return muxService.createMuxThumbnail(assetId, time)
}

/**
 * Delete a Mux asset
 */
export const deleteMuxAsset = async (assetId: string): Promise<boolean> => {
  const muxService = getMuxService()
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
  const muxService = getMuxService()
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
  const muxService = getMuxService()
  return muxService.updateAsset(assetId, data)
}
