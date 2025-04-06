// src/app/(frontend)/video/[slug]/page.tsx
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import React from 'react'
import { format } from 'date-fns'
import { VideoPlayer } from '@/components/VideoPlayer'
import { VideoCard } from '@/components/VideoCard'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const videos = await payload.find({
    collection: 'videos',
    limit: 100,
  })

  return videos.docs.map((video) => ({
    slug: video.slug,
  }))
}

export async function generateMetadata({ params }) {
  const { slug } = params
  const payload = await getPayload({ config: configPromise })

  const videos = await payload.find({
    collection: 'videos',
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const video = videos.docs[0]

  if (!video) {
    return {
      title: 'Video Not Found',
    }
  }

  return {
    title: `${video.title} | OTT Platform`,
    description: video.description,
  }
}

export default async function VideoPage({ params }) {
  const { slug } = params
  const payload = await getPayload({ config: configPromise })

  const videos = await payload.find({
    collection: 'videos',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2, // To populate related data
  })

  const video = videos.docs[0]

  if (!video) {
    notFound()
  }

  // Get related videos
  let relatedVideos = []

  if (video.relatedVideos && video.relatedVideos.length > 0) {
    // Use explicitly defined related videos
    relatedVideos = video.relatedVideos
  } else if (video.category) {
    // Fallback to videos in the same category
    const sameCategory = await payload.find({
      collection: 'videos',
      where: {
        and: [
          {
            category: {
              equals: typeof video.category === 'object' ? video.category.id : video.category,
            },
          },
          {
            id: {
              not_equals: video.id,
            },
          },
        ],
      },
      limit: 4,
    })

    relatedVideos = sameCategory.docs
  }

  return (
    <div className="container py-8">
      <div className="lg:flex lg:gap-8">
        <div className="lg:w-3/4">
          <div className="aspect-video mb-6">
            <VideoPlayer video={video} />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{video.title}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
              {video.publishedAt && (
                <time dateTime={video.publishedAt}>
                  {format(new Date(video.publishedAt), 'MMMM d, yyyy')}
                </time>
              )}

              {video.duration && (
                <span>
                  {Math.floor(video.duration / 60)}:
                  {(video.duration % 60).toString().padStart(2, '0')}
                </span>
              )}

              {video.category && typeof video.category === 'object' && (
                <span className="font-medium text-primary">{video.category.title}</span>
              )}
            </div>

            {video.description && (
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">
                {video.description}
              </p>
            )}
          </div>

          {/* Series information if applicable */}
          {video.series && (
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h2 className="text-xl font-bold mb-2">
                {typeof video.series === 'object' ? video.series.title : 'Series'}
              </h2>

              {video.seasonNumber && (
                <p className="text-gray-600 dark:text-gray-300">
                  Season {video.seasonNumber}
                  {video.episodeNumber ? `, Episode ${video.episodeNumber}` : ''}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="lg:w-1/4">
          <h2 className="text-xl font-bold mb-4">Up Next</h2>

          <div className="space-y-4">
            {relatedVideos.map((relatedVideo) => (
              <VideoCard key={relatedVideo.id} video={relatedVideo} className="!shadow-none" />
            ))}

            {relatedVideos.length === 0 && (
              <p className="text-gray-500">No related videos found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
