// src/components/VideoCard.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { PlayCircleIcon } from 'lucide-react'
import Image from 'next/image'

type VideoCardProps = {
  video: {
    title: string
    slug: string
    thumbnail?: {
      filename: string
      alt?: string
    }
    duration: number
    publishedAt?: string
    category?: {
      title: string
    } | string
  }
  className?: string
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, className = '' }) => {
  if (!video) return null

  const { title, slug, thumbnail, duration, publishedAt, category } = video

  // Format duration for display (e.g., "1:23:45")
  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${className}`}>
      <Link href={`/videos/${slug}`} className="block relative">
        <div className="aspect-video relative overflow-hidden">
          {thumbnail ? (
            <Image
              src={`/media/${thumbnail.filename}`}
              alt={thumbnail.alt || title}
              className="w-full h-full object-cover"
              width={640}
              height={360}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <PlayCircleIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}

          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(duration)}
          </div>
        </div>
      </Link>

      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-medium line-clamp-2">
          <Link href={`/videos/${slug}`} className="hover:text-primary transition-colors">
            {title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardFooter className="py-2 px-4 flex items-center justify-between text-xs text-gray-500">
        {category && (
          <span className="font-medium text-primary">
            {typeof category === 'object' ? category.title : 'Uncategorized'}
          </span>
        )}

        {publishedAt && (
          <time dateTime={publishedAt}>{format(new Date(publishedAt), 'MMM d, yyyy')}</time>
        )}
      </CardFooter>
    </Card>
  )
}






