import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/payload/payloadClient'
import { createMuxService } from '@/services/mux'
import { logger } from '@/utils/logger'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'
import { createSimulcastTarget, getSimulcastTargets } from '@/services/mux/simulcastService'

/**
 * GET /api/live-events/:id/simulcast-targets
 * 
 * Get all simulcast targets for a live event
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ message: 'Live event ID is required' }, { status: 400 })
    }

    logger.info({ context: 'simulcast-targets' }, `Fetching simulcast targets for live event ${id}`)

    // Get Payload client
    const payload = await getPayloadClient()

    // Get the live event
    const liveEvent = await payload.findByID({
      collection: 'live-events',
      id,
    })

    if (!liveEvent) {
      return NextResponse.json({ message: 'Live event not found' }, { status: 404 })
    }

    if (!liveEvent.muxLiveStreamId) {
      return NextResponse.json({ message: 'Live event has no associated Mux live stream' }, { status: 400 })
    }

    // Get simulcast targets from Mux
    const muxTargets = await getSimulcastTargets(liveEvent.muxLiveStreamId)
    
    // Map Mux targets to our format and merge with existing targets to preserve status
    const existingTargets = liveEvent.simulcastTargets || []
    
    const updatedTargets = muxTargets.map(muxTarget => {
      // Find matching target in existing targets
      const existingTarget = existingTargets.find(target => target.id === muxTarget.id)
      
      return {
        id: muxTarget.id,
        name: muxTarget.name || 'Unnamed Target',
        url: muxTarget.url,
        streamKey: muxTarget.stream_key,
        status: existingTarget?.status || 'disconnected',
      }
    })
    
    // Update the live event with the latest targets
    await payload.update({
      collection: 'live-events',
      id,
      data: {
        simulcastTargets: updatedTargets,
      },
    })

    return NextResponse.json({ 
      simulcastTargets: updatedTargets,
      message: 'Simulcast targets fetched successfully' 
    })
  } catch (error) {
    logger.error(
      { context: 'simulcast-targets', error },
      `Failed to fetch simulcast targets for live event ${params.id}`
    )
    
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Failed to fetch simulcast targets' 
    }, { status: 500 })
  }
}

/**
 * POST /api/live-events/:id/simulcast-targets
 * 
 * Add a new simulcast target to a live event
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ message: 'Live event ID is required' }, { status: 400 })
    }

    // Parse request body
    const body = await req.json()
    const { name, url, streamKey } = body
    
    if (!name || !url || !streamKey) {
      return NextResponse.json({ message: 'Name, URL, and stream key are required' }, { status: 400 })
    }
    
    if (!url.startsWith('rtmp://')) {
      return NextResponse.json({ message: 'URL must start with rtmp://' }, { status: 400 })
    }

    logger.info({ context: 'simulcast-targets' }, `Adding simulcast target for live event ${id}`)

    // Get Payload client
    const payload = await getPayloadClient()

    // Get the live event
    const liveEvent = await payload.findByID({
      collection: 'live-events',
      id,
    })

    if (!liveEvent) {
      return NextResponse.json({ message: 'Live event not found' }, { status: 404 })
    }

    if (!liveEvent.muxLiveStreamId) {
      return NextResponse.json({ message: 'Live event has no associated Mux live stream' }, { status: 400 })
    }

    // Create simulcast target in Mux
    const simulcastTarget = await createSimulcastTarget(liveEvent.muxLiveStreamId, {
      url,
      stream_key: streamKey,
      name,
    })

    // Format the target for our database
    const newTarget = {
      id: simulcastTarget.id,
      name,
      url,
      streamKey,
      status: 'disconnected',
    }

    // Add the target to the live event
    const existingTargets = liveEvent.simulcastTargets || []
    const updatedTargets = [...existingTargets, newTarget]
    
    await payload.update({
      collection: 'live-events',
      id,
      data: {
        simulcastTargets: updatedTargets,
      },
    })

    // Emit event
    await eventService.emit(EVENTS.LIVE_STREAM_UPDATED, {
      id,
      muxLiveStreamId: liveEvent.muxLiveStreamId,
      changes: ['simulcastTargets'],
      timestamp: Date.now(),
    })

    return NextResponse.json({ 
      simulcastTarget: newTarget,
      message: 'Simulcast target added successfully' 
    })
  } catch (error) {
    logger.error(
      { context: 'simulcast-targets', error },
      `Failed to add simulcast target for live event ${params.id}`
    )
    
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Failed to add simulcast target' 
    }, { status: 500 })
  }
}
