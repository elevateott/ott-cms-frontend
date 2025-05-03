import { logger } from '@/utils/logger';
/**
 * Delete All VideoAssets API
 * 
 * Provides an endpoint for deleting all video assets in the system
 */

import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { logError } from '@/utils/errorHandler'
import { createMuxService } from '@/services/mux'

/**
 * DELETE /api/videoassets/delete-all
 * 
 * Delete all video assets in the system
 */
export async function DELETE(req: NextRequest) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get all video asset IDs
    const result = await payload.find({
      collection: 'videoassets',
      limit: 1000, // Set a high limit to get all video assets
      depth: 0,
    })

    const videoAssetIds = result.docs.map(videoAsset => videoAsset.id)
    const totalVideoAssets = videoAssetIds.length

    if (totalVideoAssets === 0) {
      return createApiResponse({ 
        message: 'No video assets found to delete',
        deletedCount: 0
      })
    }

    logger.info({ context: 'videoassets/delete-all/route' }, `Deleting ${totalVideoAssets} video assets...`)

    // Delete each video asset
    const deletePromises = videoAssetIds.map(id => 
      payload.delete({
        collection: 'videoassets',
        id,
      })
    )

    await Promise.all(deletePromises)

    logger.info({ context: 'videoassets/delete-all/route' }, `Successfully deleted ${totalVideoAssets} video assets`)

    return createApiResponse({ 
      message: `Successfully deleted ${totalVideoAssets} video assets`,
      deletedCount: totalVideoAssets
    })
  } catch (error) {
    logError(error, 'DeleteAllVideoAssetsAPI')
    return createErrorResponse('Failed to delete video assets', 500)
  }
}
