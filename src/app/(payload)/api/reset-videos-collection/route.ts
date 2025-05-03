import { logger } from '@/utils/logger';
/**
 * Reset Videos Collection API
 * 
 * This endpoint completely removes the Videos collection from the database
 * and recreates it with a minimal configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logError } from '@/utils/errorHandler'
import mongoose from 'mongoose'

/**
 * GET /api/reset-videos-collection
 * 
 * Resets the Videos collection in the database
 */
export async function GET(req: NextRequest) {
  try {
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    logger.info({ context: 'reset-videos-collection/route' }, 'Starting Videos collection reset process...')
    
    // Get the MongoDB connection from Payload
    const db = mongoose.connection
    
    try {
      // 1. Drop the Videos collection from MongoDB
      logger.info({ context: 'reset-videos-collection/route' }, 'Dropping videos collection from MongoDB...')
      await db.collection('videos').drop()
      logger.info({ context: 'reset-videos-collection/route' }, 'Successfully dropped videos collection')
    } catch (dropError) {
      // Collection might not exist, which is fine
      logger.info({ context: 'reset-videos-collection/route' }, 'Could not drop videos collection, it might not exist:', dropError.message)
    }
    
    try {
      // 2. Drop the related collections
      logger.info({ context: 'reset-videos-collection/route' }, 'Dropping videos_versions collection...')
      await db.collection('videos_versions').drop()
      logger.info({ context: 'reset-videos-collection/route' }, 'Successfully dropped videos_versions collection')
    } catch (dropError) {
      logger.info({ context: 'reset-videos-collection/route' }, 'Could not drop videos_versions collection, it might not exist:', dropError.message)
    }
    
    try {
      // 3. Remove the collection from Payload's internal collections registry
      logger.info({ context: 'reset-videos-collection/route' }, 'Removing videos from payload_collections...')
      await db.collection('payload_collections').deleteOne({ slug: 'videos' })
      logger.info({ context: 'reset-videos-collection/route' }, 'Successfully removed videos from payload_collections')
    } catch (removeError) {
      logger.info({ context: 'reset-videos-collection/route' }, 'Could not remove videos from payload_collections:', removeError.message)
    }
    
    // 4. Create a test video to verify the collection is working
    logger.info({ context: 'reset-videos-collection/route' }, 'Creating a test video to verify the collection is working...')
    try {
      const testVideo = await payload.create({
        collection: 'videos',
        data: {
          title: 'Test Video After Reset',
          description: 'This video was created after resetting the collection',
          sourceType: 'embedded',
          embeddedUrl: 'https://example.com/test.m3u8',
        },
      })
      
      logger.info({ context: 'reset-videos-collection/route' }, 'Successfully created test video:', testVideo.id)
      
      return NextResponse.json({
        success: true,
        message: 'Videos collection has been reset successfully',
        testVideo,
      })
    } catch (createError) {
      logger.error({ context: 'reset-videos-collection/route' }, 'Error creating test video:', createError)
      
      return NextResponse.json({
        success: false,
        message: 'Videos collection was reset, but could not create a test video',
        error: createError.message,
      }, { status: 500 })
    }
  } catch (error) {
    logError(error, 'ResetVideosCollectionAPI')
    return NextResponse.json({
      success: false,
      message: 'Failed to reset Videos collection',
      error: error.message,
    }, { status: 500 })
  }
}
