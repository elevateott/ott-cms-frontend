'use client'

import React from 'react'
import { cn } from '@/utilities/ui'
import VideoCard, { VideoCardProps } from './VideoCard'

export interface VideoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  videos: Omit<VideoCardProps, 'onEdit' | 'onView' | 'onDelete'>[]
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  onEdit?: (id: string) => void
  onView?: (id: string) => void
  onDelete?: (id: string) => void
}

const columnsStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

const gapStyles = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  className,
  videos,
  columns = 3,
  gap = 'md',
  onEdit,
  onView,
  onDelete,
  ...props
}) => {
  if (!videos?.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto mb-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p>No videos available.</p>
        <p className="text-sm mt-2">Upload a video to get started.</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid',
        columnsStyles[columns],
        gapStyles[gap],
        'auto-rows-fr', // This ensures equal height rows
        className,
      )}
      {...props}
    >
      {videos.map((video) => (
        <div key={video.id} className="aspect-[16/9]">
          {' '}
          {/* Force 16:9 aspect ratio */}
          <VideoCard
            {...video}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            className="w-full"
          />
        </div>
      ))}
    </div>
  )
}

export default VideoGrid
