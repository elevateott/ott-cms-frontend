import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createMuxService } from '@/services/mux'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { logError } from '@/utils/errorHandler'

/**
 * POST /api/mux/auto-captions
 * 
 * Generate auto-captions for a Mux asset
 */
export async function POST(request: NextRequest) {
  try {
    logger.info({ context: 'auto-captions/route' }, 'Generating auto-captions')

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Authenticate the request
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get the request body
    const body = await request.json()
    const { assetId, language } = body

    // Validate required fields
    if (!assetId) {
      return createErrorResponse('Missing required field: assetId', 400)
    }

    // Initialize Mux service
    const muxService = await createMuxService()

    // Generate auto-captions
    const result = await muxService.generateAutoCaptions(assetId, {
      language: language || 'en',
    })

    // Return the result
    return createApiResponse(result, {
      message: 'Auto-captions generation initiated successfully',
      status: 202, // Accepted - the request has been accepted for processing
    })
  } catch (error) {
    logError(error, 'auto-captions/route.POST')
    return createErrorResponse(
      `Failed to generate auto-captions: ${error instanceof Error ? error.message : String(error)}`,
      500
    )
  }
}
