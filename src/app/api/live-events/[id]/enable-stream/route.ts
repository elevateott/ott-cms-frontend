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

    logger.info({ context: 'enable-stream' }, `Enabling live stream for live event ${id}`)

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

    // Get Mux service
    const muxService = await createMuxService()

    // Enable the live stream
    const success = await muxService.enableLiveStream(liveEvent.muxLiveStreamId)

    if (!success) {
      return NextResponse.json({ message: 'Failed to enable Mux live stream' }, { status: 500 })
    }

    // Update the live event
    await payload.update({
      collection: 'live-events',
      id,
      data: {
        muxStatus: 'idle',
      },
    })

    // Emit event
    await eventService.emit(EVENTS.LIVE_STREAM_UPDATED, {
      id,
      muxLiveStreamId: liveEvent.muxLiveStreamId,
      changes: ['muxStatus'],
      timestamp: Date.now(),
    })

    logger.info({ context: 'enable-stream' }, `Successfully enabled live stream for live event ${id}`)

    return NextResponse.json({ message: 'Live stream enabled successfully' })
  } catch (error) {
    logger.error({ context: 'enable-stream' }, 'Error enabling live stream:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
