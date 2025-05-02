import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { createMuxService } from '@/services/mux'
import { logError } from '@/utils/errorHandler'

/**
 * GET /api/admin/recordings/[id]/signed-playback
 * 
 * Generate a signed playback URL for a recording
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Get TTL from query parameters (default to 60 seconds)
    const { searchParams } = new URL(req.url)
    const ttlParam = parseInt(searchParams.get('ttl') || '60', 10)
    
    // Limit TTL to a maximum of 1 hour for security
    const ttl = Math.min(ttlParam, 3600)
    
    logger.info(
      { context: 'signed-playback/route' },
      `Generating signed playback URL for recording ${id} with TTL ${ttl}s`
    )
    
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Authenticate the request
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }
    
    // Get the recording
    const recording = await payload.findByID({
      collection: 'recordings',
      id,
    })
    
    if (!recording) {
      return createErrorResponse('Recording not found', 404)
    }
    
    // Check if the recording has a playback ID
    if (!recording.muxPlaybackId) {
      return createErrorResponse('Recording has no playback ID', 400)
    }
    
    // Initialize the Mux service
    const muxService = await createMuxService()
    
    // Generate the signed URL
    const signedUrl = await muxService.generateSignedPlaybackUrl(recording.muxPlaybackId, {
      expiresIn: ttl,
    })
    
    return createApiResponse({
      signedUrl,
      expiresIn: ttl,
    })
  } catch (error) {
    logError(error, 'SignedPlaybackAPI')
    return createErrorResponse('Failed to generate signed playback URL', 500)
  }
}
