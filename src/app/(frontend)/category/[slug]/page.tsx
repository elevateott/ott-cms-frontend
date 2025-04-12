import { Metadata, ResolvingMetadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import { VideoCard } from '@/components/VideoCard'
import type { Video as PayloadVideo } from '@/payload-types'
import { VIDEO_SOURCE_TYPES } from '@/constants'

// Define a simpler type for what VideoCard actually needs
type VideoCardProps = {
  id: string
  title: string
  slug: string
  thumbnail?: {
    filename: string
    alt?: string
  }
  duration: number
  publishedAt?: string
  category?: string | { title: string }
}

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
  })

  return categories.docs.map((category) => ({
    slug: category.slug,
  }))
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params
  const { slug } = params
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const category = categories.docs[0]

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${category.title} | OTT Platform`,
    description: category.description,
  }
}

export default async function CategoryPage(props: Props) {
  const params = await props.params
  const { slug } = params
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const category = categories.docs[0]

  if (!category) {
    notFound()
  }

  // Get videos in this category
  const videos = await payload.find({
    collection: 'videos',
    where: {
      category: {
        equals: category.id,
      },
      visibility: {
        not_equals: 'private',
      },
    },
    sort: '-publishedAt',
  })

  // Filter out videos with missing required fields and transform data
  const validVideos = videos.docs
    .filter((video): video is PayloadVideo => {
      return Boolean(
        video &&
        video.id &&
        video.title &&
        video.slug &&
        typeof video.duration === 'number' &&
        video.sourceType &&
        (video.sourceType === VIDEO_SOURCE_TYPES.MUX || video.sourceType === VIDEO_SOURCE_TYPES.EMBEDDED) &&
        video.updatedAt &&
        video.createdAt
      )
    })
    .map((video): VideoCardProps => {
      // Ensure we have a valid slug
      const videoSlug = typeof video.slug === 'string' ? video.slug : `video-${video.id}`

      return {
        id: video.id,
        title: video.title,
        slug: videoSlug,
        thumbnail: video.thumbnail && typeof video.thumbnail === 'object' && 'filename' in video.thumbnail && video.thumbnail.filename
          ? { filename: video.thumbnail.filename, alt: video.thumbnail.alt ?? undefined }
          : undefined,
        duration: video.duration ?? 0,
        publishedAt: video.publishedAt || undefined,
        category: video.category && typeof video.category === 'object' ? { title: video.category.title } : video.category as string,
      }
    })

  return (
    <div className="container py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{category.title}</h1>
        {category.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300">{category.description}</p>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {validVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}

        {validVideos.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No videos in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}






