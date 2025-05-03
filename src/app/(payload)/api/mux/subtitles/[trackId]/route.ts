import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createMuxService } from '@/services/mux'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { logError } from '@/utils/errorHandler'

/**
 * DELETE /api/mux/subtitles/{trackId}?assetId={assetId}
 * 
 * Delete a subtitle track from a Mux asset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { trackId: string } }
) {
  try {
    const trackId = params.trackId

    // Get the asset ID from the query parameters
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')

    if (!assetId) {
      return createErrorResponse('Missing required parameter: assetId', 400)
    }

    logger.info(
      { context: 'subtitles/[trackId]/route' },
      `Deleting subtitle track ${trackId} from asset ${assetId}`
    )

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Authenticate the request
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Initialize Mux service
    const muxService = await createMuxService()

    // Delete the subtitle track
    const success = await muxService.deleteSubtitleTrack(assetId, trackId)

    if (!success) {
      return createErrorResponse('Failed to delete subtitle track', 500)
    }

    // Return success
    return createApiResponse(
      { success: true },
      {
        message: 'Subtitle track deleted successfully',
      }
    )
  } catch (error) {
    logError(error, 'subtitles/[trackId]/route.DELETE')
    return createErrorResponse(
      `Failed to delete subtitle track: ${error instanceof Error ? error.message : String(error)}`,
      500
    )
  }
}
