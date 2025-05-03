// src/hooks/mux/fetchLiveStreamStatus.ts
import { logger } from '@/utils/logger'
import type { CollectionAfterReadHook } from 'payload'
import { createMuxService } from '@/services/mux'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Hook to fetch the latest status of a live stream from Mux
 *
 * This hook is called after a live event document is read from the database.
 * It fetches the latest status from Mux and updates the document in memory.
 * If the status has changed, it also updates the database.
 */
export const fetchLiveStreamStatus: CollectionAfterReadHook = async ({ doc, req }) => {
  // Only proceed if the document has a Mux live stream ID
  if (!doc?.muxLiveStreamId) {
    return doc
  }

  try {
    logger.info(
      { context: 'fetchLiveStreamStatus' },
      `Fetching latest status for live stream ${doc.muxLiveStreamId}`,
    )

    // Get Mux service
    const muxService = await createMuxService()

    // Fetch the live stream from Mux
    const liveStream = await muxService.getLiveStream(doc.muxLiveStreamId)

    if (!liveStream) {
      logger.warn(
        { context: 'fetchLiveStreamStatus' },
        `Live stream ${doc.muxLiveStreamId} not found in Mux`,
      )
      return doc
    }

    // Get the current status from Mux
    const currentStatus = liveStream.status

    // If the status has changed, update the document in the database
    if (doc.muxStatus !== currentStatus) {
      logger.info(
        { context: 'fetchLiveStreamStatus' },
        `Status changed for live stream ${doc.muxLiveStreamId}: ${doc.muxStatus} -> ${currentStatus}`,
      )

      // Update the document in memory
      doc.muxStatus = currentStatus

      // Update the document in the database
      try {
        // Use req.payload if available, otherwise get a new payload instance
        const payload = req?.payload || (await getPayload({ config: configPromise }))

        if (payload) {
          await payload.update({
            collection: 'live-events',
            id: doc.id,
            data: {
              muxStatus: currentStatus,
            },
          })

          logger.info(
            { context: 'fetchLiveStreamStatus' },
            `Successfully updated status for live stream ${doc.muxLiveStreamId} in database`,
          )
        } else {
          logger.warn(
            { context: 'fetchLiveStreamStatus' },
            `Could not get payload instance to update status for live stream ${doc.muxLiveStreamId}`,
          )
        }
      } catch (updateError) {
        logger.error(
          { context: 'fetchLiveStreamStatus', error: updateError },
          `Failed to update status for live stream ${doc.muxLiveStreamId} in database`,
        )
      }
    } else {
      logger.info(
        { context: 'fetchLiveStreamStatus' },
        `Status unchanged for live stream ${doc.muxLiveStreamId}: ${currentStatus}`,
      )
    }
  } catch (error) {
    logger.error(
      { context: 'fetchLiveStreamStatus', error },
      `Failed to fetch status for live stream ${doc.muxLiveStreamId}`,
    )
    // Don't throw an error, just return the document as is
    // This ensures the UI doesn't break if Mux is unavailable
  }

  return doc
}
