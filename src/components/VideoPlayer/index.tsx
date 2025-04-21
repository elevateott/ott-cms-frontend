// src/components/VideoPlayer/index.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Hls from 'hls.js'
import MuxVideo from '@mux/mux-video-react'

type VideoAsset = {
  id: string
  title: string
  sourceType: 'mux' | 'embedded'
  muxData?: {
    playbackId?: string
    status?: string
  }
  embeddedUrl?: string
}

type VideoPlayerProps = {
  video: any // Can be either old Video type or new VideoAsset type
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  className?: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  className = '',
}) => {
  const [_playerReady, setPlayerReady] = useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)

  // Handle HLS/embedded videos with hls.js
  useEffect(() => {
    if (!video || !videoRef.current || video.sourceType !== 'embedded') return

    const videoElement = videoRef.current
    const embeddedUrl = video.embeddedUrl

    // Check if HLS is supported natively
    if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Use native HLS in Safari
      videoElement.src = embeddedUrl
      videoElement.addEventListener('loadedmetadata', () => {
        setPlayerReady(true)
      })
    } else if (Hls.isSupported()) {
      // Use hls.js for other browsers
      const hls = new Hls()
      hls.loadSource(embeddedUrl)
      hls.attachMedia(videoElement)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPlayerReady(true)
        if (autoplay) videoElement.play().catch((e) => console.error('Autoplay failed:', e))
      })
    } else {
      console.error('HLS is not supported in this browser')
    }
  }, [video, autoplay])

  if (!video) return null

  // Handle different video source types
  const isMuxVideo = video?.sourceType === 'mux' && video?.muxData?.playbackId
  const isEmbeddedVideo = video?.sourceType === 'embedded' && video?.embeddedUrl

  if (isMuxVideo) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`}>
        <MuxVideo
          playbackId={video.muxData.playbackId}
          metadata={{
            video_title: video.title,
            video_id: video.id,
          }}
          autoPlay={autoplay}
          loop={loop}
          muted={muted}
          controls={controls}
          style={{ width: '100%', height: '100%' }}
          onLoadedMetadata={() => setPlayerReady(true)}
        />
      </div>
    )
  }

  if (isEmbeddedVideo) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${className}`}>
        <video
          ref={videoRef}
          controls={controls}
          autoPlay={autoplay}
          loop={loop}
          muted={muted}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    )
  }

  return <div className="p-4 border rounded">Video source not available</div>
}

export default VideoPlayer
