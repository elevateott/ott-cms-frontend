'use client'

/**
 * VideoThumbnail Component
 *
 * A reusable component for displaying video thumbnails
 */

import React from 'react'
import { cn } from '@/utilities/ui'
import Image from 'next/image'
import { customImageLoader, getFallbackImageUrl } from '@/utilities/imageLoader'

export interface VideoThumbnailProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  playbackId?: string
  width?: number
  height?: number
  aspectRatio?: string
  fallbackText?: string
  isHoverable?: boolean
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  className,
  src,
  alt = 'Video thumbnail',
  playbackId,
  width = 320,
  height = 180,
  aspectRatio = '16/9',
  fallbackText = 'No thumbnail',
  isHoverable = false,
  ...props
}) => {
  const [imgError, setImgError] = React.useState(false)

  // Determine the source URL
  const thumbnailSrc = imgError
    ? getFallbackImageUrl(width, height, 'Video')
    : src ||
      (playbackId
        ? `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=preserve`
        : getFallbackImageUrl(width, height, 'Video'))

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-gray-100',
        isHoverable && 'group transition-transform hover:scale-105',
        className,
      )}
      style={{ aspectRatio }}
      {...props}
    >
      {thumbnailSrc ? (
        <div className="relative w-full h-full">
          <Image
            src={thumbnailSrc}
            alt={alt}
            width={width}
            height={height}
            className="object-cover w-full h-full"
            loader={customImageLoader}
            unoptimized
            onError={() => {
              console.error(`Failed to load image: ${thumbnailSrc}`)
              setImgError(true)
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
          {fallbackText}
        </div>
      )}

      {isHoverable && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-gray-900"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoThumbnail
