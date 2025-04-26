import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import HLS from 'hls-parser'
import { VideoAssetRepository } from '@/repositories/videoAssetRepository'

/**
 * POST /api/videoassets/create-embedded
 * 
 * Creates a new video asset with sourceType: "embedded"
 * Parses the HLS manifest to extract metadata
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json()
    const { title, embeddedUrl } = body

    if (!embeddedUrl) {
      return NextResponse.json(
        { success: false, message: 'Embedded URL is required' },
        { status: 400 }
      )
    }

    if (!embeddedUrl.endsWith('.m3u8')) {
      return NextResponse.json(
        { success: false, message: 'URL must be an HLS .m3u8 stream' },
        { status: 400 }
      )
    }

    logger.info(
      { context: 'create-embedded/route' },
      `Creating embedded video asset with URL: ${embeddedUrl}`
    )

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Create a new instance of the repository with the payload context
    const videoAssetRepo = new VideoAssetRepository({ payload })

    // Fetch and parse the HLS manifest to extract metadata
    let duration = 0
    let aspectRatio = null

    try {
      const response = await fetch(embeddedUrl)
      
      if (!response.ok) {
        logger.warn(
          { context: 'create-embedded/route' },
          `Failed to fetch HLS manifest: ${embeddedUrl}, status: ${response.status}`
        )
      } else {
        const text = await response.text()
        const manifest = HLS.parse(text)
        
        // Calculate total duration from segments
        if (manifest.segments && manifest.segments.length > 0) {
          duration = manifest.segments.reduce((acc, seg) => acc + (seg.duration || 0), 0)
        }
        
        // Try to get resolution from variants
        if (manifest.variants && manifest.variants.length > 0) {
          const variant = manifest.variants[0]
          if (variant.resolution) {
            const { width, height } = variant.resolution
            if (width && height) {
              aspectRatio = `${width}:${height}`
            }
          }
        }
        
        logger.info(
          { context: 'create-embedded/route' },
          `Parsed HLS manifest metadata:`,
          { duration, aspectRatio }
        )
      }
    } catch (error) {
      logger.warn(
        { context: 'create-embedded/route' },
        `Error parsing HLS manifest: ${embeddedUrl}`,
        error
      )
      // Continue with creation even if parsing fails
    }

    // Generate a title if not provided
    const videoTitle = title || embeddedUrl.split('/').pop()?.split('.')[0] || 'Untitled Video'
    
    // Prepare the data for creating a new video asset
    const videoAssetData = {
      title: videoTitle,
      sourceType: 'embedded',
      embeddedUrl,
      duration: duration || null,
      aspectRatio: aspectRatio || null,
      // Generate a slug from the title
      slug: videoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    }

    // Create the video asset
    const result = await videoAssetRepo.create(videoAssetData)

    logger.info(
      { context: 'create-embedded/route' },
      `Successfully created embedded video asset:`,
      { id: result.id, title: result.title }
    )

    return NextResponse.json({
      success: true,
      message: 'Embedded video asset created successfully',
      id: result.id,
      title: result.title,
      embeddedUrl: result.embeddedUrl,
      duration: result.duration,
      aspectRatio: result.aspectRatio,
    })
  } catch (error) {
    logger.error(
      { context: 'create-embedded/route' },
      'Error creating embedded video asset:',
      error
    )
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error creating embedded video asset' 
      },
      { status: 500 }
    )
  }
}
