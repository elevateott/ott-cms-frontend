import { logger } from '@/utils/logger'
import type { CollectionAfterChangeHook } from 'payload'
import { updateMuxAsset } from '@/utilities/mux'

/**
 * Hook to update Mux asset properties when a video asset is updated in the CMS
 */
export const updateMuxAssetOnVideoAssetChange: CollectionAfterChangeHook = async ({
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

  const assetId = doc.muxData.assetId

  // Check if any of the Mux advanced settings have changed
  const hasAdvancedSettingsChanged =
    !previousDoc.muxAdvancedSettings ||
    doc.muxAdvancedSettings?.videoQuality !== previousDoc.muxAdvancedSettings?.videoQuality ||
    doc.muxAdvancedSettings?.maxResolution !== previousDoc.muxAdvancedSettings?.maxResolution ||
    doc.muxAdvancedSettings?.playbackPolicy !== previousDoc.muxAdvancedSettings?.playbackPolicy ||
    doc.muxAdvancedSettings?.normalizeAudio !== previousDoc.muxAdvancedSettings?.normalizeAudio ||
    doc.muxAdvancedSettings?.autoGenerateCaptions !==
      previousDoc.muxAdvancedSettings?.autoGenerateCaptions

  // If no relevant fields have changed, return the document as is
  if (!hasAdvancedSettingsChanged) {
    return doc
  }

  logger.info(
    { context: 'mux' },
    `Updating Mux asset ${assetId} with advanced settings from video asset ${doc.id}`,
  )

  try {
    // Prepare the data for the Mux API
    const updateData = {
      // Convert playbackPolicy to array as required by Mux API
      playback_policy: [doc.muxAdvancedSettings?.playbackPolicy || 'public'],
      // Set mp4_support to 'none' by default
      mp4_support: 'none',
      // Map videoQuality to encoding_tier
      encoding_tier: doc.muxAdvancedSettings?.videoQuality || 'basic',
      // Map maxResolution to max_resolution_tier
      max_resolution_tier: doc.muxAdvancedSettings?.maxResolution || '1080p',
      // Set normalize_audio directly
      normalize_audio: doc.muxAdvancedSettings?.normalizeAudio || false,
      // Set generated_subtitles based on autoGenerateCaptions
      generated_subtitles: doc.muxAdvancedSettings?.autoGenerateCaptions
        ? [{ name: 'English', language_code: 'en-US' }]
        : [],
    }

    logger.info({ context: 'mux' }, 'Updating Mux asset with data:', updateData)

    // Call the Mux API to update the asset
    await updateMuxAsset(assetId, updateData)

    logger.info({ context: 'mux' }, `Successfully updated Mux asset ${assetId}`)
  } catch (error) {
    logger.error(
      { context: 'mux' },
      `Error updating Mux asset ${assetId}:`,
      error instanceof Error ? error.message : String(error),
    )
  }

  // Always return the document
  return doc
}
