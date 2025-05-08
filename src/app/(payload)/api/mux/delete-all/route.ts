/**
 * Delete All Mux Videos API
 *
 * Provides an endpoint for deleting all videos in Mux
 */

import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { logError } from '@/utils/errorHandler'
import { createMuxService } from '@/services/mux'

/**
 * DELETE /api/mux/delete-all
 *
 * Delete all videos in Mux
 */
export async function DELETE(req: NextRequest) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Create a request object with payload
    const payloadReq = {
      payload,
      payloadAPI: 'local',
    }

    // Initialize the Mux service
    const muxService = await createMuxService()

    // Delete all Mux videos with better error handling
    try {
      const result = await muxService.deleteAllMuxAssets()

      return createApiResponse({
        message: `Successfully deleted ${result.count} Mux videos`,
        ...result,
      })
    } catch (muxError) {
      // Log the specific Mux error
      logError(muxError, 'DeleteAllMuxVideosAPI.muxService.deleteAllMuxAssets')
      throw new Error(
        `Failed to delete Mux videos: ${muxError instanceof Error ? muxError.message : String(muxError)}`,
      )
    }
  } catch (error) {
    // Log the full error details
    logError(error, 'DeleteAllMuxVideosAPI')

    // Create a more detailed error response
    const errorMessage =
      error instanceof Error
        ? `Failed to delete Mux videos: ${error.message}`
        : 'Failed to delete Mux videos: Unknown error'

    return createErrorResponse(errorMessage, 500)
  }
}
