import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/payload/payloadClient'
import { createMuxService } from '@/services/mux'
import { logger } from '@/utils/logger'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ message: 'Live event ID is required' }, { status: 400 })
    }

    logger.info({ context: 'go-live' }, `Starting live stream for live event ${id}`)

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

    // Check if the stream is in a valid state to be started
    if (!['idle', 'disconnected'].includes(liveEvent.muxStatus)) {
      return NextResponse.json({ 
        message: `Cannot start stream with status '${liveEvent.muxStatus}'. Stream must be idle or disconnected.` 
      }, { status: 400 })
    }

    // Get Mux service
    const muxService = await createMuxService()

    // Enable the live stream if it's not already enabled
    if (liveEvent.muxStatus === 'disconnected') {
      const success = await muxService.enableLiveStream(liveEvent.muxLiveStreamId)
      
      if (!success) {
        return NextResponse.json({ message: 'Failed to enable Mux live stream' }, { status: 500 })
      }
    }

    // Update the live event
    await payload.update({
      collection: 'live-events',
      id,
      data: {
        startedAt: new Date().toISOString(),
        // We don't update muxStatus here because it will be updated by the webhook
      },
    })

    // Emit event
    await eventService.emit(EVENTS.LIVE_STREAM_UPDATED, {
      id,
      muxLiveStreamId: liveEvent.muxLiveStreamId,
      changes: ['startedAt'],
      timestamp: Date.now(),
    })

    logger.info({ context: 'go-live' }, `Successfully started live stream for live event ${id}`)

    return NextResponse.json({ message: 'Live stream started successfully' })
  } catch (error) {
    logger.error({ context: 'go-live' }, 'Error starting live stream:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
