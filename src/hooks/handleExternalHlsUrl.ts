// src/hooks/handleExternalHlsUrl.ts
import { logger } from '@/utils/logger'
import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Hook to handle external HLS URL
 * 
 * This hook runs before a live event is created or updated.
 * If useExternalHlsUrl is enabled, it clears all Mux-related fields.
 */
export const handleExternalHlsUrl: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  try {
    // Check if useExternalHlsUrl is enabled
    if (data.useExternalHlsUrl) {
      logger.info(
        { context: 'handleExternalHlsUrl' },
        'External HLS URL enabled, clearing Mux fields'
      )
      
      // If this is an update operation and useExternalHlsUrl was just enabled
      if (operation === 'update' && originalDoc && !originalDoc.useExternalHlsUrl) {
        logger.info(
          { context: 'handleExternalHlsUrl' },
          'Switching from Mux to external HLS URL, clearing Mux fields'
        )
      }
      
      // Clear all Mux-related fields
      return {
        ...data,
        muxLiveStreamId: null,
        muxStreamKey: null,
        muxPlaybackIds: [],
        muxStatus: null,
        muxCreatedAt: null,
        recordingAssetId: null,
      }
    }
    
    // If useExternalHlsUrl is disabled but externalHlsUrl is still set, clear it
    if (!data.useExternalHlsUrl && data.externalHlsUrl) {
      logger.info(
        { context: 'handleExternalHlsUrl' },
        'External HLS URL disabled, clearing externalHlsUrl field'
      )
      
      return {
        ...data,
        externalHlsUrl: null,
      }
    }
    
    // Otherwise, return the data unchanged
    return data
  } catch (error) {
    logger.error(
      { context: 'handleExternalHlsUrl', error },
      'Error handling external HLS URL'
    )
    
    // Return the data unchanged
    return data
  }
}
