import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/payload/payloadClient'
import { createMuxService } from '@/services/mux'
import { logger } from '@/utils/logger'
import { EVENTS } from '@/constants/events'
import { eventService } from '@/services/eventService'
import { deleteSimulcastTarget } from '@/services/mux/simulcastService'

/**
 * DELETE /api/live-events/:id/simulcast-targets/:targetId
 * 
 * Delete a simulcast target from a live event
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; targetId: string } }
): Promise<NextResponse> {
  try {
    const { id, targetId } = params
    
    if (!id || !targetId) {
      return NextResponse.json({ message: 'Live event ID and target ID are required' }, { status: 400 })
    }

    logger.info({ context: 'simulcast-targets' }, `Deleting simulcast target ${targetId} from live event ${id}`)

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

    // Delete simulcast target from Mux
    await deleteSimulcastTarget(liveEvent.muxLiveStreamId, targetId)

    // Remove the target from the live event
    const existingTargets = liveEvent.simulcastTargets || []
    const updatedTargets = existingTargets.filter(target => target.id !== targetId)
    
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
      message: 'Simulcast target deleted successfully' 
    })
  } catch (error) {
    logger.error(
      { context: 'simulcast-targets', error },
      `Failed to delete simulcast target ${params.targetId} from live event ${params.id}`
    )
    
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Failed to delete simulcast target' 
    }, { status: 500 })
  }
}
