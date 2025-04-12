// src/components/MuxPlayer.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import MuxVideoReact from '@mux/mux-video-react'
import { cn } from '@/utilities/ui'

type MuxPlayerProps = {
  playbackId: string
  title: string
  videoId: string
  poster?: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  startTime?: number
  endTime?: number
  onViewEvent?: (eventType: string, data: any) => void
  preferredRendition?: 'lowest' | 'low' | 'medium' | 'high' | 'highest'
  thumbnailTime?: number
  maxResolution?: '1080p' | '720p' | '480p' | '360p'
}

type PlayerState = {
  playing: boolean
  currentTime: number
  duration: number
  buffering: boolean
  volume: number
  muted: boolean
  playbackRate: number
  error: string | null
}

const MuxPlayer: React.FC<MuxPlayerProps> = ({
  playbackId,
  title,
  videoId,
  poster,
  className,
  autoPlay = false,
  loop = false,
  muted = false,
  startTime,
  endTime,
  onViewEvent,
  preferredRendition = 'high',
  thumbnailTime = 0,
  maxResolution,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playerState, setPlayerState] = useState<PlayerState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    buffering: false,
    volume: 1,
    muted: muted,
    playbackRate: 1,
    error: null,
  })

  // Track view events for analytics
  useEffect(() => {
    const video = videoRef.current
    if (!video || !onViewEvent) return

    let viewStarted = false
    let viewComplete = false
    let quarterViewed = false
    let halfViewed = false
    let threeQuartersViewed = false

    const trackProgress = () => {
      const currentTime = video.currentTime
      const duration = video.duration

      if (!viewStarted && currentTime > 0) {
        viewStarted = true
        onViewEvent('view_start', { videoId, playbackId, timestamp: new Date() })
      }

      // Track percentage viewed
      if (duration) {
        const percentage = currentTime / duration

        if (!quarterViewed && percentage >= 0.25) {
          quarterViewed = true
          onViewEvent('view_progress', {
            videoId,
            playbackId,
            percentage: 25,
            timestamp: new Date(),
          })
        }

        if (!halfViewed && percentage >= 0.5) {
          halfViewed = true
          onViewEvent('view_progress', {
            videoId,
            playbackId,
            percentage: 50,
            timestamp: new Date(),
          })
        }

        if (!threeQuartersViewed && percentage >= 0.75) {
          threeQuartersViewed = true
          onViewEvent('view_progress', {
            videoId,
            playbackId,
            percentage: 75,
            timestamp: new Date(),
          })
        }

        if (!viewComplete && percentage >= 0.95) {
          viewComplete = true
          onViewEvent('view_complete', { videoId, playbackId, timestamp: new Date() })
        }
      }
    }

    video.addEventListener('timeupdate', trackProgress)

    return () => {
      video.removeEventListener('timeupdate', trackProgress)
    }
  }, [playbackId, videoId, onViewEvent])

  // Handle events to update player state
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setPlayerState((prev) => ({ ...prev, playing: true }))
    const handlePause = () => setPlayerState((prev) => ({ ...prev, playing: false }))
    const handleTimeUpdate = () =>
      setPlayerState((prev) => ({ ...prev, currentTime: video.currentTime }))
    const handleDurationChange = () =>
      setPlayerState((prev) => ({ ...prev, duration: video.duration }))
    const handleVolumeChange = () =>
      setPlayerState((prev) => ({ ...prev, volume: video.volume, muted: video.muted }))
    const handleRateChange = () =>
      setPlayerState((prev) => ({ ...prev, playbackRate: video.playbackRate }))

    const handleWaiting = () => setPlayerState((prev) => ({ ...prev, buffering: true }))
    const handlePlaying = () => setPlayerState((prev) => ({ ...prev, buffering: false }))

    const handleError = () => {
      setPlayerState((prev) => ({
        ...prev,
        error: videoRef.current?.error?.message || 'An unknown error occurred',
      }))
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('volumechange', handleVolumeChange)
    video.addEventListener('ratechange', handleRateChange)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('volumechange', handleVolumeChange)
      video.removeEventListener('ratechange', handleRateChange)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('error', handleError)
    }
  }, [])

  // Apply custom poster if provided
  const posterUrl =
    poster ||
    (playbackId
      ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${thumbnailTime}`
      : undefined)

  // Construct custom playback URL with options
  let playbackUrl = playbackId

  // Apply max resolution if specified
  if (maxResolution) {
    playbackUrl = `${playbackUrl}?max_resolution=${maxResolution}`
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <MuxVideoReact
        ref={videoRef}
        playbackId={playbackUrl}
        streamType="on-demand"
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        preload="auto"
        playsInline
        controls
        style={{ width: '100%', height: '100%' }}
        poster={posterUrl}
        metadata={{
          video_id: videoId,
          video_title: title,
          player_name: 'OTT Platform Custom Player',
        }}
      />

      {playerState.error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center text-white p-4">
          <div className="text-center">
            <p className="text-red-400 mb-2">Error playing video</p>
            <p className="text-sm">{playerState.error}</p>
          </div>
        </div>
      )}

      {playerState.buffering && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  )
}

export default MuxPlayer
