// src/hooks/mux/deleteAssetOnVideoDelete.ts
import type { CollectionBeforeDeleteHook } from 'payload'
import { createMuxService } from '@/services/mux'

/**
 * Hook to delete a Mux asset when a video is deleted in the CMS
 *
 * This is used when deleting a single video in the CMS
 */
export const deleteAssetOnVideoDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
  collection,
}) => {
  if (collection.slug === 'videoassets') {
    try {
      const { payload } = req

      // Get the video data
      const video = (await payload.findByID({
        collection: 'videoassets',
        id,
      })) as any // Use proper type when available

      // Check if it's a Mux video with an asset ID
      if (video?.sourceType === 'mux' && video?.muxData?.assetId) {
        // Initialize the Mux service
        const muxService = createMuxService()

        // Delete the Mux asset
        await muxService.deleteAsset(video.muxData.assetId)
        payload.logger.info(`Deleted Mux asset ${video.muxData.assetId} for video ${id}`)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      req.payload.logger.error(`Error deleting Mux asset for video ${id}: ${errorMessage}`)
      // Continue with the deletion anyway
    }
  }

  return
}
