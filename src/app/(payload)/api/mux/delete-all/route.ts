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
    const muxService = createMuxService()

    // Delete all Mux videos
    const result = await muxService.deleteAllMuxAssets()

    return createApiResponse({
      message: `Successfully deleted ${result.count} Mux videos`,
      ...result,
    })
  } catch (error) {
    logError(error, 'DeleteAllMuxVideosAPI')
    return createErrorResponse('Failed to delete Mux videos', 500)
  }
}
