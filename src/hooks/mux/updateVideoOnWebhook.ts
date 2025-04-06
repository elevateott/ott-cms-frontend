// src/hooks/mux/updateVideoOnWebhook.ts
import { CollectionAfterChangeHook } from 'payload'
import type { Video } from '@/payload-types'

export const fetchMuxMetadata: CollectionAfterChangeHook<Video> = async ({
  doc,
  req,
  operation,
}) => {
  // Only proceed if this is a new or updated video with Mux source
  if (
    (operation === 'create' || operation === 'update') &&
    doc.sourceType === 'mux' &&
    doc.muxData?.assetId &&
    doc.muxData?.status === 'processing'
  ) {
    try {
      const { payload } = req

      // Check if we already have a scheduled job to poll for this video
      const existingJobs = await payload.find({
        collection: 'mux-webhook-jobs',
        where: {
          assetId: {
            equals: doc.muxData.assetId,
          },
        },
      })

      if (existingJobs.docs.length === 0) {
        // Create a job to poll Mux for video status (in case webhook is missed)
        await payload.create({
          collection: 'mux-webhook-jobs',
          data: {
            videoId: doc.id,
            assetId: doc.muxData.assetId,
            status: 'pending',
            attemptCount: 0,
            lastAttempt: new Date().toISOString(),
          },
        })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      req.payload.logger.error(
        `Error scheduling Mux metadata fetch for video ${doc.id}: ${errorMessage}`,
      )
    }
  }

  return doc
}
