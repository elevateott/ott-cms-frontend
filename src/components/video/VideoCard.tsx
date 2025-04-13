'use client'

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
  className?: string
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
  className,
  onEdit,
  onView,
  onDelete,
}) => {
  return (
    <Card className={`h-full flex flex-col border-2 border-blue-500 ${className}`}>
      <div className="relative w-full">
        <VideoThumbnail
          src={thumbnailUrl}
          playbackId={playbackId}
          alt={title}
          isHoverable
          className="w-full"
        />
      </div>
      <CardContent className="flex-grow p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-medium line-clamp-1" title={title}>
            {title}
          </h3>
          {status && <VideoStatusBadge status={status} />}
        </div>
        <div className="mt-2 flex items-center text-sm text-muted-foreground">
          <span>{new Date(createdAt).toLocaleDateString()}</span>
          {duration && (
            <>
              <span className="mx-2">•</span>
              <span>{formatDuration(duration)}</span>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2">
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
