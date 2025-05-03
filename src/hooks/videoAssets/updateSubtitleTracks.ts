import { logger } from '@/utils/logger'
import type { CollectionAfterChangeHook } from 'payload'
import { SubtitleTrack } from '@/types/videoAsset'
import { createSubtitleTrack, deleteSubtitleTrack } from '@/utilities/mux'

/**
 * Hook to sync subtitle tracks with Mux when a video asset is updated
 */
export const updateSubtitleTracks: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Only proceed if this is a Mux video, it's an update operation, and we have an assetId
  if (
    doc.sourceType !== 'mux' ||
    operation !== 'update' ||
    !doc.muxData?.assetId ||
    doc.muxData?.status !== 'ready'
  ) {
    return doc
  }

  try {
    const assetId = doc.muxData.assetId

    // Get the current and previous subtitle tracks
    const currentTracks = doc.subtitles?.tracks || []
    const previousTracks = previousDoc.subtitles?.tracks || []

    // Find tracks that were added (exist in current but not in previous)
    const addedTracks = currentTracks.filter(
      (track: SubtitleTrack) =>
        !track.muxTrackId && // Only process tracks without a Mux track ID
        !previousTracks.some((prevTrack: SubtitleTrack) => prevTrack.id === track.id)
    )

    // Find tracks that were removed (exist in previous but not in current)
    const removedTracks = previousTracks.filter(
      (prevTrack: SubtitleTrack) =>
        prevTrack.muxTrackId && // Only process tracks with a Mux track ID
        !currentTracks.some((track: SubtitleTrack) => track.id === prevTrack.id)
    )

    // Process added tracks
    for (const track of addedTracks) {
      if (track.url) {
        try {
          logger.info(
            { context: 'updateSubtitleTracks' },
            `Creating subtitle track for asset ${assetId} with language ${track.language}`
          )

          const result = await createSubtitleTrack(
            assetId,
            {
              language: track.language,
              name: track.name,
              closedCaptions: track.closedCaptions,
              type: track.kind,
            },
            track.url
          )

          // Update the track with the Mux track ID
          if (result && result.id) {
            track.muxTrackId = result.id
            logger.info(
              { context: 'updateSubtitleTracks' },
              `Successfully created subtitle track ${result.id} for asset ${assetId}`
            )
          }
        } catch (error) {
          logger.error(
            { context: 'updateSubtitleTracks' },
            `Error creating subtitle track for asset ${assetId}:`,
            error
          )
        }
      }
    }

    // Process removed tracks
    for (const track of removedTracks) {
      if (track.muxTrackId) {
        try {
          logger.info(
            { context: 'updateSubtitleTracks' },
            `Deleting subtitle track ${track.muxTrackId} from asset ${assetId}`
          )

          const success = await deleteSubtitleTrack(assetId, track.muxTrackId)

          if (success) {
            logger.info(
              { context: 'updateSubtitleTracks' },
              `Successfully deleted subtitle track ${track.muxTrackId} from asset ${assetId}`
            )
          } else {
            logger.warn(
              { context: 'updateSubtitleTracks' },
              `Failed to delete subtitle track ${track.muxTrackId} from asset ${assetId}`
            )
          }
        } catch (error) {
          logger.error(
            { context: 'updateSubtitleTracks' },
            `Error deleting subtitle track ${track.muxTrackId} from asset ${assetId}:`,
            error
          )
        }
      }
    }

    // Update the document with the updated tracks
    return {
      ...doc,
      subtitles: {
        ...doc.subtitles,
        tracks: currentTracks,
      },
    }
  } catch (error) {
    logger.error(
      { context: 'updateSubtitleTracks' },
      `Error updating subtitle tracks for asset ${doc.muxData?.assetId}:`,
      error
    )
    return doc
  }
}
