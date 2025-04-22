import { logger } from '@/utils/logger';
import type { CollectionAfterChangeHook } from 'payload'
import { createMuxService } from '@/services/mux'

// Cache to prevent excessive API calls
const processedAssets = new Map<string, number>()
const CACHE_TTL = 60000 // 1 minute

export const fetchMuxMetadataForVideoAsset: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Only proceed if this is a Mux video and we have an assetId
  if (doc.sourceType === 'mux' && doc.muxData?.assetId) {
    const assetId = doc.muxData.assetId

    // Check if we've processed this asset recently
    const lastProcessed = processedAssets.get(assetId)
    const now = Date.now()

    if (lastProcessed && now - lastProcessed < CACHE_TTL) {
      logger.info({ context: 'mux' }, 
        `Skipping Mux metadata fetch for asset ${assetId} - processed ${now - lastProcessed}ms ago`,
      )
      return doc
    }

    // Mark this asset as processed
    processedAssets.set(assetId, now)

    // Clean up old entries from the cache
    for (const [cachedAssetId, timestamp] of processedAssets.entries()) {
      if (now - timestamp > CACHE_TTL) {
        processedAssets.delete(cachedAssetId)
      }
    }

    try {
      const muxService = createMuxService()
      const assetData = await muxService.getAsset(assetId)

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
      logger.error({ context: 'mux' }, 'Error fetching Mux metadata for video asset:', error)
    }
  }

  return doc
}
