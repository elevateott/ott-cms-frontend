import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import VideoAssetRepository from '@/repositories/videoAssetRepository'
import { logger } from '@/utils/logger'

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json()
    const { title, assetId, playbackId, sourceType = 'mux' } = body

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Create a new instance of the repository with the payload context
    const videoAssetRepo = new VideoAssetRepository({ payload })

    // Prepare the data for creating a new video asset
    const videoAssetData = {
      title,
      sourceType,
      muxData: {
        assetId: assetId || null,
        playbackId: playbackId || null,
        status: assetId ? 'ready' : 'uploading',
      },
      // Generate a slug from the title
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    }

    // If we have a playback ID, add the thumbnail URL
    if (playbackId) {
      videoAssetData.muxThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=preserve`
    }

    // Create the video asset
    logger.info({ context: 'test/create-videoasset' }, `Creating video asset with title: ${title}`)
    const result = await videoAssetRepo.create(videoAssetData)

    return NextResponse.json({ 
      success: true, 
      message: 'Video asset created successfully', 
      videoAsset: result 
    })
  } catch (error) {
    logger.error({ context: 'test/create-videoasset', error }, 'Error creating video asset')
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
