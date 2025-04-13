import { CollectionAfterChangeHook } from 'payload/types';
import { createMuxService } from '@/services/serviceFactory';

export const fetchMuxMetadata: CollectionAfterChangeHook = async ({ doc, req }) => {
  // If this is a Mux video and it has an assetId
  if (doc.sourceType === 'mux' && doc.muxData?.assetId) {
    try {
      // Skip if we're already processing this asset
      if (doc.muxData?.status === 'processing') {
        return doc;
      }

      // Skip if we already have all the metadata we need
      if (doc.duration && doc.aspectRatio && doc.muxData?.playbackId) {
        return doc;
      }

      const muxService = createMuxService();
      const muxAsset = await muxService.getAsset(doc.muxData.assetId);

      if (muxAsset) {
        // Only update if there are actual changes
        const updates: any = {};

        if (!doc.duration && muxAsset.duration) {
          updates.duration = muxAsset.duration;
        }

        if (!doc.aspectRatio && muxAsset.aspectRatio) {
          updates.aspectRatio = muxAsset.aspectRatio;
        }

        const muxDataUpdates: any = {};
        if (doc.muxData?.status !== muxAsset.status) {
          muxDataUpdates.status = muxAsset.status;
        }

        if (!doc.muxData?.playbackId && muxAsset.playbackIds?.[0]?.id) {
          muxDataUpdates.playbackId = muxAsset.playbackIds[0].id;
        }

        // Only perform update if there are actual changes
        if (Object.keys(updates).length > 0 || Object.keys(muxDataUpdates).length > 0) {
          await req.payload.update({
            collection: 'videos',
            id: doc.id,
            data: {
              ...updates,
              muxData: {
                ...doc.muxData,
                ...muxDataUpdates
              }
            }
          });
        }
      }
    } catch (error) {
      // Log error but don't throw to prevent webhook failure
      req.payload.logger.error(`Error fetching Mux metadata for video ${doc.id}: ${error}`);
    }
  }

  return doc;
};



