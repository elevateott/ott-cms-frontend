import type { CollectionBeforeDeleteHook } from 'payload'
import { createMuxService } from '@/services/mux'

/**
 * Hook to delete a Mux asset when a video asset is deleted in the CMS
 *
 * This is used when deleting a single video asset in the CMS
 */
export const deleteAssetOnVideoAssetDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
  collection,
}) => {
  if (collection.slug === 'videoassets') {
    try {
      const { payload } = req

      // Get the video asset data
      const videoAsset = await payload.findByID({
        collection: 'videoassets',
        id,
      })

      // Check if it's a Mux video with an asset ID
      if (videoAsset?.sourceType === 'mux' && videoAsset?.muxData?.assetId) {
        // Initialize the Mux service
        const muxService = createMuxService()

        // Delete the Mux asset
        await muxService.deleteAsset(videoAsset.muxData.assetId)
        payload.logger.info(`Deleted Mux asset ${videoAsset.muxData.assetId} for video asset ${id}`)
      }
    } catch (error) {
      req.payload.logger.error(`Error deleting Mux asset for video asset ${id}: ${error}`)
    }
  }
}
