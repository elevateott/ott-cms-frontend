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

    logger.info({ context: 'end-stream' }, `Ending live stream for live event ${id}`)

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

    // Check if the stream is in a valid state to be ended
    if (!['active', 'disconnected'].includes(liveEvent.muxStatus)) {
      return NextResponse.json({ 
        message: `Cannot end stream with status '${liveEvent.muxStatus}'. Stream must be active or disconnected.` 
      }, { status: 400 })
    }

    // Get Mux service
    const muxService = await createMuxService()

    // Complete the live stream
    const success = await muxService.completeLiveStream(liveEvent.muxLiveStreamId)

    if (!success) {
      return NextResponse.json({ message: 'Failed to end Mux live stream' }, { status: 500 })
    }

    // Update the live event
    await payload.update({
      collection: 'live-events',
      id,
      data: {
        muxStatus: 'completed',
        endedAt: new Date().toISOString(),
      },
    })

    // Emit event
    await eventService.emit(EVENTS.LIVE_STREAM_UPDATED, {
      id,
      muxLiveStreamId: liveEvent.muxLiveStreamId,
      changes: ['muxStatus', 'endedAt'],
      timestamp: Date.now(),
    })

    logger.info({ context: 'end-stream' }, `Successfully ended live stream for live event ${id}`)

    return NextResponse.json({ message: 'Live stream ended successfully' })
  } catch (error) {
    logger.error({ context: 'end-stream' }, 'Error ending live stream:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
