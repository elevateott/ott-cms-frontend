// src/utils/getPlaybackUrl.ts

/**
 * Get the appropriate playback URL for a live event
 * 
 * This function prioritizes external HLS URLs over Mux playback URLs.
 * 
 * @param liveEvent The live event document
 * @returns The playback URL or null if none is available
 */
export function getPlaybackUrl(liveEvent: any): string | null {
  // If using external HLS URL and it exists, return it
  if (liveEvent?.useExternalHlsUrl && liveEvent?.externalHlsUrl) {
    return liveEvent.externalHlsUrl
  }
  
  // Otherwise, use Mux playback URL if available
  if (liveEvent?.muxPlaybackIds && liveEvent.muxPlaybackIds.length > 0) {
    const playbackId = liveEvent.muxPlaybackIds[0]?.playbackId
    if (playbackId) {
      return `https://stream.mux.com/${playbackId}.m3u8`
    }
  }
  
  // No playback URL available
  return null
}
