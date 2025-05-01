import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createMuxService } from '@/services/mux'
import { logger } from '@/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Live event ID is required' },
        { status: 400 }
      )
    }

    // Get payload instance
    const payload = await getPayload({ config: configPromise })

    // Get the live event
    const liveEvent = await payload.findByID({
      collection: 'live-events',
      id,
    })

    if (!liveEvent) {
      return NextResponse.json(
        { error: 'Live event not found' },
        { status: 404 }
      )
    }

    // If the live event has a Mux live stream ID, fetch the latest status
    if (liveEvent.muxLiveStreamId) {
      try {
        // Get Mux service
        const muxService = await createMuxService()

        // Fetch the live stream from Mux
        const liveStream = await muxService.getLiveStream(liveEvent.muxLiveStreamId)

        if (liveStream) {
          // Update the live event with the latest status
          await payload.update({
            collection: 'live-events',
            id,
            data: {
              muxStatus: liveStream.status,
            },
          })

          // Get the updated live event
          const updatedLiveEvent = await payload.findByID({
            collection: 'live-events',
            id,
          })

          return NextResponse.json(updatedLiveEvent)
        }
      } catch (error) {
        logger.error(
          { context: 'api/live-events/[id]', error },
          `Failed to fetch status for live stream ${liveEvent.muxLiveStreamId}`
        )
      }
    }

    // Return the live event as is if we couldn't update the status
    return NextResponse.json(liveEvent)
  } catch (error) {
    logger.error(
      { context: 'api/live-events/[id]', error },
      'Failed to get live event'
    )
    return NextResponse.json(
      { error: 'Failed to get live event' },
      { status: 500 }
    )
  }
}
