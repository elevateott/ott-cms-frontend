import { CollectionAfterChangeHook } from 'payload'
import { createMuxService } from '@/services/serviceFactory'

// Keep track of videos being processed to prevent recursive calls
const processingVideos = new Set<string>()

// Add rate limiting to prevent too many requests to Mux
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second between requests

export const fetchMuxMetadata: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  // Skip if this is a webhook-triggered update (to prevent recursive calls)
  if (req.originalUrl?.includes('/api/mux/webhook')) {
    console.log(`Skipping Mux metadata fetch for webhook-triggered update of video ${doc.id}`)
    return doc
  }

  // Skip if we're already processing this video
  if (processingVideos.has(doc.id)) {
    console.log(`Skipping Mux metadata fetch for video ${doc.id} - already being processed`)
    return doc
  }

  // If this is a Mux video and it has an assetId
  if (doc.sourceType === 'mux' && doc.muxData?.assetId) {
    try {
      // Skip if we're already processing this asset
      if (doc.muxData?.status === 'processing') {
        console.log(`Skipping Mux metadata fetch for video ${doc.id} - status is processing`)
        return doc
      }

      // Skip if we already have all the metadata we need
      if (doc.duration && doc.aspectRatio && doc.muxData?.playbackId) {
        console.log(`Skipping Mux metadata fetch for video ${doc.id} - already have all metadata`)
        return doc
      }

      // Add to processing set
      processingVideos.add(doc.id)

      // Apply rate limiting
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest
        console.log(
          `Rate limiting: Waiting ${delay}ms before fetching Mux metadata for video ${doc.id}`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
      lastRequestTime = Date.now()

      console.log(`Fetching Mux metadata for video ${doc.id} with assetId ${doc.muxData.assetId}`)
      const muxService = createMuxService()
      const muxAsset = await muxService.getAsset(doc.muxData.assetId)

      if (muxAsset) {
        // Only update if there are actual changes
        const updates: any = {}

        if (!doc.duration && muxAsset.duration) {
          updates.duration = muxAsset.duration
        }

        if (!doc.aspectRatio && muxAsset.aspectRatio) {
          updates.aspectRatio = muxAsset.aspectRatio
        }

        const muxDataUpdates: any = {}
        if (doc.muxData?.status !== muxAsset.status) {
          muxDataUpdates.status = muxAsset.status
        }

        if (!doc.muxData?.playbackId && muxAsset.playbackIds?.[0]?.id) {
          muxDataUpdates.playbackId = muxAsset.playbackIds[0].id
        }

        // Only perform update if there are actual changes
        if (Object.keys(updates).length > 0 || Object.keys(muxDataUpdates).length > 0) {
          console.log(`Updating video ${doc.id} with Mux metadata:`, { updates, muxDataUpdates })

          // Set a flag to prevent the hook from running again on this update
          const updatedDoc = await req.payload.update({
            collection: 'videos',
            id: doc.id,
            data: {
              ...updates,
              muxData: {
                ...doc.muxData,
                ...muxDataUpdates,
              },
            },
            // Add this option to skip hooks
            depth: 0, // Minimize depth to avoid unnecessary processing
          })

          console.log(`Successfully updated video ${doc.id} with Mux metadata`)
          return updatedDoc
        }
      }
    } catch (error) {
      // Log error but don't throw to prevent webhook failure
      req.payload.logger.error(`Error fetching Mux metadata for video ${doc.id}: ${error}`)
    } finally {
      // Remove from processing set
      processingVideos.delete(doc.id)
    }
  }

  return doc
}
