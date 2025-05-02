import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/payload/payloadClient'
import { createMuxService } from '@/services/mux'
import { logger } from '@/utils/logger'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ message: 'Live event ID is required' }, { status: 400 })
    }

    logger.info({ context: 'health-stats' }, `Fetching health stats for live event ${id}`)

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
      return NextResponse.json(
        { message: 'Live event has no associated Mux live stream' },
        { status: 400 },
      )
    }

    // Get Mux service
    const muxService = await createMuxService()

    // Fetch the live stream from Mux
    const liveStream = await muxService.getLiveStream(liveEvent.muxLiveStreamId)

    if (!liveStream) {
      return NextResponse.json({ message: 'Failed to fetch Mux live stream' }, { status: 500 })
    }

    // Extract health data
    const healthData = {
      stream_health: liveStream.stream_health,
      video_bitrate: liveStream.video_bitrate,
      video_frame_rate: liveStream.video_frame_rate,
      video_codec: liveStream.video_codec,
      video_resolution: liveStream.video_resolution,
      audio_bitrate: liveStream.audio_bitrate,
      last_seen_time: liveStream.last_seen_time,
      errors: liveStream.errors || [],
      status: liveStream.status,
      // Add viewer count if available (from Mux Data or other sources)
      viewer_count: liveStream.viewer_count,
      // Add dropped frames if available
      dropped_frames: liveStream.dropped_frames,
      // Include any additional metrics that might be available
      recent_input_video_bitrate: liveStream.recent_input_video_bitrate,
      recent_input_video_frame_rate: liveStream.recent_input_video_frame_rate,
      recent_input_audio_bitrate: liveStream.recent_input_audio_bitrate,
      recent_input_height: liveStream.recent_input_height,
      recent_input_width: liveStream.recent_input_width,
      recent_input_last_seen: liveStream.recent_input_last_seen,
    }

    logger.info(
      { context: 'health-stats' },
      `Successfully fetched health stats for live event ${id}`,
    )

    return NextResponse.json(healthData)
  } catch (error) {
    logger.error({ context: 'health-stats' }, 'Error fetching health stats:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 },
    )
  }
}
