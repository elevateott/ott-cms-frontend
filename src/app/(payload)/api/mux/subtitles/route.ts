import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createMuxService } from '@/services/mux'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { logError } from '@/utils/errorHandler'

/**
 * POST /api/mux/subtitles
 * 
 * Create a subtitle track for a Mux asset
 */
export async function POST(request: NextRequest) {
  try {
    logger.info({ context: 'subtitles/route' }, 'Creating subtitle track')

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Authenticate the request
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get the request body
    const body = await request.json()
    const { assetId, language, name, kind, closedCaptions, fileUrl } = body

    // Validate required fields
    if (!assetId) {
      return createErrorResponse('Missing required field: assetId', 400)
    }
    if (!language) {
      return createErrorResponse('Missing required field: language', 400)
    }
    if (!fileUrl) {
      return createErrorResponse('Missing required field: fileUrl', 400)
    }

    // Initialize Mux service
    const muxService = await createMuxService()

    // Create the subtitle track
    const result = await muxService.createSubtitleTrack(
      assetId,
      {
        language,
        name: name || language,
        closedCaptions: closedCaptions || false,
        type: kind || 'subtitles',
      },
      fileUrl
    )

    // Return the result
    return createApiResponse(result, {
      message: 'Subtitle track created successfully',
      status: 201,
    })
  } catch (error) {
    logError(error, 'subtitles/route.POST')
    return createErrorResponse(
      `Failed to create subtitle track: ${error instanceof Error ? error.message : String(error)}`,
      500
    )
  }
}

/**
 * GET /api/mux/subtitles?assetId={assetId}
 * 
 * Get all subtitle tracks for a Mux asset
 */
export async function GET(request: NextRequest) {
  try {
    // Get the asset ID from the query parameters
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')

    if (!assetId) {
      return createErrorResponse('Missing required parameter: assetId', 400)
    }

    logger.info({ context: 'subtitles/route' }, `Getting subtitle tracks for asset ${assetId}`)

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Authenticate the request
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Initialize Mux service
    const muxService = await createMuxService()

    // Get the subtitle tracks
    const tracks = await muxService.getSubtitleTracks(assetId)

    // Return the tracks
    return createApiResponse(tracks, {
      message: 'Subtitle tracks retrieved successfully',
    })
  } catch (error) {
    logError(error, 'subtitles/route.GET')
    return createErrorResponse(
      `Failed to get subtitle tracks: ${error instanceof Error ? error.message : String(error)}`,
      500
    )
  }
}
