'use client'

import React from 'react'
import { cn } from '@/utilities/ui'
import Image from 'next/image'
import { customImageLoader } from '@/utilities/imageLoader'

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

  const thumbnailSrc =
    imgError || !src
      ? playbackId
        ? `https://image.mux.com/${playbackId}/thumbnail.jpg?width=${width}&height=${height}&fit_mode=preserve`
        : 'https://placehold.co/320x180'
      : src

  return (
    <div className={cn('relative w-full aspect-video overflow-hidden group', className)} {...props}>
      <Image
        src={thumbnailSrc}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover"
        loader={customImageLoader}
        unoptimized
        onError={() => setImgError(true)}
      />

      {/* {isHoverable && thumbnailSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-8 w-8 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-full h-full"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )} */}
    </div>
  )
}

export default VideoThumbnail
