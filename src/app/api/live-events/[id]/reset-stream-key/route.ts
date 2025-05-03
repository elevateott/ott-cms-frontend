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

    logger.info({ context: 'reset-stream-key' }, `Resetting stream key for live event ${id}`)

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

    // Check if the stream is disabled
    if (liveEvent.muxStatus === 'disabled') {
      return NextResponse.json({ message: 'Cannot reset stream key for a disabled stream' }, { status: 400 })
    }

    // Get Mux service
    const muxService = await createMuxService()

    // Reset the stream key
    const result = await muxService.resetStreamKey(liveEvent.muxLiveStreamId)

    if (!result || !result.stream_key) {
      return NextResponse.json({ message: 'Failed to reset Mux stream key' }, { status: 500 })
    }

    // Update the live event with the new stream key
    await payload.update({
      collection: 'live-events',
      id,
      data: {
        muxStreamKey: result.stream_key,
      },
    })

    // Emit event
    await eventService.emit(EVENTS.LIVE_STREAM_UPDATED, {
      id,
      muxLiveStreamId: liveEvent.muxLiveStreamId,
      changes: ['muxStreamKey'],
      timestamp: Date.now(),
    })

    logger.info({ context: 'reset-stream-key' }, `Successfully reset stream key for live event ${id}`)

    return NextResponse.json({ 
      message: 'Stream key reset successfully',
      streamKey: result.stream_key
    })
  } catch (error) {
    logger.error({ context: 'reset-stream-key' }, 'Error resetting stream key:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
