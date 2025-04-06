// src/hooks/mux/deleteAssetOnVideoDelete.ts
import { CollectionBeforeDeleteHook } from 'payload'
import { deleteMuxAsset } from '@/utilities/mux'

export const deleteAssetOnVideoDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
  collection,
}) => {
  if (collection.slug === 'videos') {
    try {
      const { payload } = req

      // Get the video data
      const video = await payload.findByID({
        collection: 'videos',
        id,
      })

      // Check if it's a Mux video with an asset ID
      if (video?.sourceType === 'mux' && video?.muxData?.assetId) {
        // Delete the Mux asset
        await deleteMuxAsset(video.muxData.assetId)
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
