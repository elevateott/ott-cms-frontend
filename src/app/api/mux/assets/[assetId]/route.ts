import { logger } from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server'
import Mux from '@mux/mux-node'
// Import payload client if needed
// import { getPayloadClient } from '@/payload/payloadClient'

// Initialize Mux client
const { Video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID || '',
  tokenSecret: process.env.MUX_TOKEN_SECRET || '',
})

export async function GET(request: NextRequest, { params }: { params: { assetId: string } }) {
  try {
    const { assetId } = params

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }

    logger.info({ context: '[assetId]/route' }, `Checking status for Mux asset: ${assetId}`)

    // Get the asset from Mux
    const asset = await Video.Assets.get(assetId)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    logger.info({ context: '[assetId]/route' }, `Asset status: ${asset.status}`)

    // Return the asset data
    return NextResponse.json({
      id: asset.id,
      status: asset.status,
      playback_ids: asset.playback_ids,
      created_at: asset.created_at,
      duration: asset.duration,
      max_stored_resolution: asset.max_stored_resolution,
      max_stored_frame_rate: asset.max_stored_frame_rate,
      aspect_ratio: asset.aspect_ratio,
    })
  } catch (error: any) {
    logger.error({ context: '[assetId]/route' }, 'Error checking Mux asset status:', error)

    // Check if it's a Mux API error
    if (error.type === 'not_found') {
      return NextResponse.json(
        { error: 'Asset not found', details: error.message },
        { status: 404 },
      )
    }

    // Check for authentication errors
    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: 'Authentication error with Mux API', details: error.message },
        { status: error.status },
      )
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to check asset status',
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
