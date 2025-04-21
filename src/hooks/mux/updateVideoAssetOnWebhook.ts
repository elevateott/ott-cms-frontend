import type { CollectionAfterChangeHook } from 'payload'
import { createMuxService } from '@/services/mux'

export const fetchMuxMetadataForVideoAsset: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Only proceed if this is a Mux video and we have an assetId
  if (doc.sourceType === 'mux' && doc.muxData?.assetId) {
    try {
      const muxService = createMuxService()
      const assetData = await muxService.getAsset(doc.muxData.assetId)

      // Only update if we got asset data and this isn't already a create operation
      if (assetData && operation !== 'create') {
        await req.payload.update({
          collection: 'videoassets', // make sure this matches your collection name
          id: doc.id,
          data: {
            duration: assetData.duration,
            aspectRatio: assetData.aspectRatio,
            // Add any other metadata fields you want to update
          },
        })
      }
    } catch (error) {
      console.error('Error fetching Mux metadata for video asset:', error)
    }
  }

  return doc
}
