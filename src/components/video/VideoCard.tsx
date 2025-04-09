'use client'

/**
 * VideoCard Component
 *
 * A card component for displaying video information
 */

import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import VideoThumbnail from './VideoThumbnail'
import VideoStatusBadge from './VideoStatusBadge'
import { formatDuration } from '@/utils/dateTime'

export interface VideoCardProps {
  id: string
  title: string
  status?: string
  playbackId?: string
  thumbnailUrl?: string
  duration?: number
  createdAt: string
  onEdit?: (id: string) => void
  onView?: (id: string) => void
  onDelete?: (id: string) => void
}

export const VideoCard: React.FC<VideoCardProps> = ({
  id,
  title,
  status,
  playbackId,
  thumbnailUrl,
  duration,
  createdAt,
  onEdit,
  onView,
  onDelete,
}) => {
  return (
    <Card variant="bordered" isHoverable>
      <CardContent className="p-0">
        <VideoThumbnail
          src={thumbnailUrl}
          playbackId={playbackId}
          alt={title}
          isHoverable
          className="w-full h-40"
        />
        <div className="p-4">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-medium line-clamp-1" title={title}>
              {title}
            </h3>
            <VideoStatusBadge status={status} />
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>{new Date(createdAt).toLocaleDateString()}</span>
            {duration && (
              <>
                <span className="mx-2">•</span>
                <span>{formatDuration(duration)}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 gap-2 flex-wrap">
        {onView && (
          <Button variant="default" size="sm" onClick={() => onView(id)}>
            View
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(id)}>
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default VideoCard
