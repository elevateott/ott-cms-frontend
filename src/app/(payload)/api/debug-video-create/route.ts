/**
 * Debug Video Creation API
 * 
 * This endpoint helps debug issues with video creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logError } from '@/utils/errorHandler'

/**
 * POST /api/debug-video-create
 * 
 * Debug endpoint for video creation
 */
export async function POST(req: NextRequest) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Get the request body
    const body = await req.json()
    
    // Log the request body for debugging
    console.log('Debug Video Create - Request Body:', JSON.stringify(body, null, 2))

    // Try to create a minimal video document
    try {
      const minimalVideo = {
        title: body.title || 'Debug Video',
        sourceType: body.sourceType || 'embedded',
        embeddedUrl: body.embeddedUrl || 'https://example.com/video.m3u8',
      }

      console.log('Attempting to create minimal video:', JSON.stringify(minimalVideo, null, 2))
      
      const result = await payload.create({
        collection: 'videos',
        data: minimalVideo,
      })
      
      return NextResponse.json({
        success: true,
        message: 'Video created successfully',
        video: result,
      })
    } catch (createError) {
      console.error('Error creating minimal video:', createError)
      
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
    logError(error, 'DebugVideoCreateAPI')
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error.message,
    }, { status: 500 })
  }
}
