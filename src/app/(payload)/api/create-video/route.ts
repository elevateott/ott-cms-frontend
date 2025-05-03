import { logger } from '@/utils/logger';
/**
 * Create Video API
 * 
 * This endpoint creates a video directly using the Payload API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logError } from '@/utils/errorHandler'

/**
 * POST /api/create-video
 * 
 * Creates a video directly using the Payload API
 */
export async function POST(req: NextRequest) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Get the request body
    const body = await req.json()
    
    // Log the request body for debugging
    logger.info({ context: 'create-video/route' }, 'Create Video API - Request Body:', JSON.stringify(body, null, 2))
    
    // Create a minimal video document
    const videoData = {
      title: body.title || 'Test Video',
      description: body.description || 'This is a test video',
      sourceType: body.sourceType || 'embedded',
      embeddedUrl: body.embeddedUrl || 'https://example.com/video.m3u8',
      slug: body.slug || undefined, // Let the hook generate it if not provided
    }
    
    logger.info({ context: 'create-video/route' }, 'Creating video with data:', JSON.stringify(videoData, null, 2))
    
    try {
      const result = await payload.create({
        collection: 'videos',
        data: videoData,
      })
      
      return NextResponse.json({
        success: true,
        message: 'Video created successfully',
        video: result,
      })
    } catch (createError) {
      logger.error({ context: 'create-video/route' }, 'Error creating video:', createError)
      
      // Try to extract validation errors
      let validationErrors = null
      if (createError.errors) {
        validationErrors = createError.errors
      }
      
      return NextResponse.json({
        success: false,
        message: 'Failed to create video',
        error: createError.message,
        validationErrors,
      }, { status: 400 })
    }
  } catch (error) {
    logError(error, 'CreateVideoAPI')
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error.message,
    }, { status: 500 })
  }
}
