import { CollectionAfterChangeHook } from 'payload/types';

export const fetchMuxMetadata: CollectionAfterChangeHook = async ({ doc, req }) => {
  // If this is a Mux video and it has an assetId
  if (doc.sourceType === 'mux' && doc.muxData?.assetId) {
    try {
      const muxAsset = await req.payload.muxService.getAsset(doc.muxData.assetId);

      if (muxAsset) {
        // Update the video with metadata from Mux
        await req.payload.update({
          collection: 'videos',
          id: doc.id,
          data: {
            duration: muxAsset.duration,
            aspectRatio: muxAsset.aspect_ratio,
            muxData: {
              ...doc.muxData,
              status: muxAsset.status,
              playbackId: muxAsset.playback_ids?.[0]?.id,
            }
          }
        });
      }
    } catch (error) {
      req.payload.logger.error(`Error fetching Mux metadata for video ${doc.id}: ${error}`);
    }
  }

  return doc;
};

