// src/utils/getPlaybackUrl.ts

/**
 * Get the appropriate playback URL for a live event
 *
 * This function prioritizes in the following order:
 * 1. External HLS URL (if useExternalHlsUrl is true)
 * 2. Simulated Live playback URL (if isSimulatedLive is true)
 * 3. Mux Live Stream playback URL
 *
 * @param liveEvent The live event document
 * @returns The playback URL or null if none is available
 */
export function getPlaybackUrl(liveEvent: any): string | null {
  // If using external HLS URL and it exists, return it
  if (liveEvent?.useExternalHlsUrl && liveEvent?.externalHlsUrl) {
    return liveEvent.externalHlsUrl
  }

  // If this is a simulated live event and has a playback ID, use that
  if (liveEvent?.isSimulatedLive && liveEvent?.simulatedLivePlaybackId) {
    return `https://stream.mux.com/${liveEvent.simulatedLivePlaybackId}.m3u8`
  }

  // Otherwise, use Mux live stream playback URL if available
  if (liveEvent?.muxPlaybackIds && liveEvent.muxPlaybackIds.length > 0) {
    const playbackId = liveEvent.muxPlaybackIds[0]?.playbackId
    if (playbackId) {
      return `https://stream.mux.com/${playbackId}.m3u8`
    }
  }

  // No playback URL available
  return null
}
