import { logger } from '@/utils/logger';
/**
 * Test Video Creation API
 * 
 * This endpoint creates a test video with minimal fields
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logError } from '@/utils/errorHandler'

/**
 * GET /api/test-video-create
 * 
 * Creates a test video with minimal fields
 */
export async function GET(req: NextRequest) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Generate a random number for the title and slug
    const random = Math.floor(Math.random() * 10000)
    
    // Create a minimal video document
    const minimalVideo = {
      title: `Test Video ${random}`,
      description: 'This is a test video created via the API',
      sourceType: 'embedded',
      embeddedUrl: 'https://example.com/video.m3u8',
      slug: `test-video-${random}`,
      slugLock: true,
    }

    logger.info({ context: 'test-video-create/route' }, 'Attempting to create test video:', JSON.stringify(minimalVideo, null, 2))
    
    try {
      const result = await payload.create({
        collection: 'videos',
        data: minimalVideo,
      })
      
      return NextResponse.json({
        success: true,
        message: 'Test video created successfully',
        video: result,
      })
    } catch (createError) {
      logger.error({ context: 'test-video-create/route' }, 'Error creating test video:', createError)
      
      // Try to extract validation errors
      let validationErrors = null
      if (createError.errors) {
        validationErrors = createError.errors
      }
      
      return NextResponse.json({
        success: false,
        message: 'Failed to create test video',
        error: createError.message,
        validationErrors,
      }, { status: 400 })
    }
  } catch (error) {
    logError(error, 'TestVideoCreateAPI')
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error.message,
    }, { status: 500 })
  }
}
