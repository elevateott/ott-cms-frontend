import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import HLS from 'hls-parser'

/**
 * POST /api/validate-hls
 * 
 * Validates an HLS manifest by fetching it and parsing it with hls-parser
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      )
    }

    if (!url.endsWith('.m3u8')) {
      return NextResponse.json(
        { success: false, message: 'URL must be an HLS .m3u8 stream' },
        { status: 400 }
      )
    }

    logger.info({ context: 'validate-hls/route' }, `Validating HLS manifest: ${url}`)

    // Fetch the manifest
    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
      },
    })

    if (!response.ok) {
      logger.warn(
        { context: 'validate-hls/route' },
        `Failed to fetch HLS manifest: ${url}, status: ${response.status}`
      )
      return NextResponse.json(
        { 
          success: false, 
          message: `Failed to fetch HLS manifest: HTTP ${response.status}` 
        },
        { status: 400 }
      )
    }

    // Get the manifest text
    const text = await response.text()

    // Parse the manifest
    try {
      const manifest = HLS.parse(text)
      
      // Extract basic metadata
      const metadata = {
        type: manifest.type,
        duration: manifest.segments?.reduce((acc, seg) => acc + (seg.duration || 0), 0) || 0,
        segments: manifest.segments?.length || 0,
        bandwidth: manifest.variants?.[0]?.bandwidth,
        resolution: manifest.variants?.[0]?.resolution,
      }

      logger.info(
        { context: 'validate-hls/route' },
        `Successfully validated HLS manifest: ${url}`,
        metadata
      )

      return NextResponse.json({
        success: true,
        message: 'HLS manifest validated successfully',
        metadata,
      })
    } catch (error) {
      logger.error(
        { context: 'validate-hls/route' },
        `Failed to parse HLS manifest: ${url}`,
        error
      )
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid HLS manifest format' 
        },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error(
      { context: 'validate-hls/route' },
      'Error validating HLS manifest:',
      error
    )
    return NextResponse.json(
      { success: false, message: 'Server error validating HLS manifest' },
      { status: 500 }
    )
  }
}
