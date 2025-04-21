'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { formatDuration } from '@/utils/dateTime'

type ContentCardProps = {
  content: {
    id: string
    title: string
    slug: string
    description?: string
    posterImage?: {
      url: string
      alt?: string
    }
    mainVideo?: {
      duration?: number
    }
    category?: {
      title: string
    }
    visibility?: 'public' | 'members' | 'premium' | 'private'
    releaseDate?: string
    trailers?: Array<any>
    bonusContent?: Array<any>
  }
  className?: string
}

export const ContentCard: React.FC<ContentCardProps> = ({ content, className = '' }) => {
  if (!content) return null

  const {
    title,
    slug,
    description,
    posterImage,
    mainVideo,
    category,
    visibility,
    releaseDate,
    trailers,
    bonusContent,
  } = content

  // Use the formatDuration utility function

  // Calculate additional content count
  const additionalContentCount =
    (Array.isArray(trailers) ? trailers.length : 0) +
    (Array.isArray(bonusContent) ? bonusContent.length : 0)

  return (
    <Card className={`overflow-hidden transition-shadow hover:shadow-md ${className}`}>
      <Link href={`/content/${slug}`} className="block relative">
        <div className="aspect-video relative overflow-hidden">
          {posterImage ? (
            <Image
              src={posterImage.url}
              alt={posterImage.alt || title}
              className="w-full h-full object-cover"
              width={640}
              height={360}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {mainVideo?.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {formatDuration(mainVideo.duration)}
            </div>
          )}

          {additionalContentCount > 0 && (
            <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
              +{additionalContentCount} videos
            </div>
          )}

          {visibility && visibility !== 'public' && (
            <div className="absolute top-2 left-2">
              <Badge variant={visibility === 'premium' ? 'destructive' : 'secondary'}>
                {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/content/${slug}`} className="block">
          <h3 className="text-lg font-semibold line-clamp-1 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        {description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {category && (
            <Badge variant="outline" className="text-xs">
              {category.title}
            </Badge>
          )}

          {releaseDate && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(releaseDate), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 border-t bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs text-gray-500">Watch now</span>
          </div>

          <Link href={`/content/${slug}`} className="text-xs text-primary hover:underline">
            View details
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ContentCard
