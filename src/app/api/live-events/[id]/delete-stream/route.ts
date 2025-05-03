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

    logger.info({ context: 'delete-stream' }, `Deleting live stream for live event ${id}`)

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

    // Delete the live stream
    const success = await muxService.deleteLiveStream(liveEvent.muxLiveStreamId)

    if (!success) {
      return NextResponse.json({ message: 'Failed to delete Mux live stream' }, { status: 500 })
    }

    // Update the live event
    await payload.update({
      collection: 'live-events',
      id,
      data: {
        muxLiveStreamId: null,
        muxStreamKey: null,
        muxPlaybackIds: [],
        muxStatus: null,
      },
    })

    // Emit event
    await eventService.emit(EVENTS.LIVE_STREAM_UPDATED, {
      id,
      changes: ['muxLiveStreamId', 'muxStreamKey', 'muxPlaybackIds', 'muxStatus'],
      timestamp: Date.now(),
    })

    logger.info({ context: 'delete-stream' }, `Successfully deleted live stream for live event ${id}`)

    return NextResponse.json({ message: 'Live stream deleted successfully' })
  } catch (error) {
    logger.error({ context: 'delete-stream' }, 'Error deleting live stream:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
