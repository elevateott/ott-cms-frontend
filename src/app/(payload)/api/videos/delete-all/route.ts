import { logger } from '@/utils/logger';
/**
 * Delete All Videos API
 * 
 * Provides an endpoint for deleting all videos in the system
 */

import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { logError } from '@/utils/errorHandler'

/**
 * DELETE /api/videos/delete-all
 * 
 * Delete all videos in the system
 */
export async function DELETE(req: NextRequest) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get all video IDs
    const result = await payload.find({
      collection: 'videos',
      limit: 1000, // Set a high limit to get all videos
      depth: 0,
    })

    const videoIds = result.docs.map(video => video.id)
    const totalVideos = videoIds.length

    if (totalVideos === 0) {
      return createApiResponse({ 
        message: 'No videos found to delete',
        deletedCount: 0
      })
    }

    logger.info({ context: 'delete-all/route' }, `Deleting ${totalVideos} videos...`)

    // Delete each video
    const deletePromises = videoIds.map(id => 
      payload.delete({
        collection: 'videos',
        id,
      })
    )

    await Promise.all(deletePromises)

    logger.info({ context: 'delete-all/route' }, `Successfully deleted ${totalVideos} videos`)

    return createApiResponse({ 
      message: `Successfully deleted ${totalVideos} videos`,
      deletedCount: totalVideos
    })
  } catch (error) {
    logError(error, 'DeleteAllVideosAPI')
    return createErrorResponse('Failed to delete videos', 500)
  }
}
