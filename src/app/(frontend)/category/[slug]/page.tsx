import { Metadata, ResolvingMetadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import Link from 'next/link'
import { VideoCard } from '@/components/VideoCard'
import type { Video as PayloadVideo } from '@/payload-types'
import { VIDEO_SOURCE_TYPES } from '@/constants/video'

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

export async function generateMetadata(
  props: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
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
    depth: 1, // To get meta.image populated
  })

  const category = categories.docs[0]

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  // Use SEO metadata if available, otherwise fall back to category fields
  const title = category.meta?.title || `${category.title} | OTT Platform`
  const description = category.meta?.description || category.description
  const image =
    category.meta?.image?.url ||
    (category.thumbnail && typeof category.thumbnail === 'object'
      ? category.thumbnail.url
      : undefined)

  // Get Twitter card settings if available
  const twitterCard = category.meta?.socialMedia?.twitterCard || 'summary_large_image'
  const twitterHandle = category.meta?.socialMedia?.twitterHandle

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: twitterCard as 'summary' | 'summary_large_image',
      creator: twitterHandle || undefined,
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: category.meta?.noIndex ? { index: false } : undefined,
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

  // Get content in this category
  const contentItems = await payload.find({
    collection: 'content',
    where: {
      categories: {
        contains: category.id,
      },
      isPublished: {
        equals: true,
      },
    },
    sort: '-releaseDate',
    depth: 1, // To get related data
  })

  // For backward compatibility, also get videos in this category
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
          (video.sourceType === VIDEO_SOURCE_TYPES.MUX ||
            video.sourceType === VIDEO_SOURCE_TYPES.EMBEDDED) &&
          video.updatedAt &&
          video.createdAt,
      )
    })
    .map((video): VideoCardProps => {
      // Ensure we have a valid slug
      const videoSlug = typeof video.slug === 'string' ? video.slug : `video-${video.id}`

      return {
        id: video.id,
        title: video.title,
        slug: videoSlug,
        thumbnail:
          video.thumbnail &&
          typeof video.thumbnail === 'object' &&
          'filename' in video.thumbnail &&
          video.thumbnail.filename
            ? { filename: video.thumbnail.filename, alt: video.thumbnail.alt ?? undefined }
            : undefined,
        duration: video.duration ?? 0,
        publishedAt: video.publishedAt || undefined,
        category:
          video.category && typeof video.category === 'object'
            ? { title: video.category.title }
            : (video.category as string),
      }
    })

  return (
    <div className="container py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{category.title}</h1>
        {category.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300">{category.description}</p>
        )}
        {category.featuredCategory && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Featured Category
            </span>
          </div>
        )}
      </header>

      {category.featuredImage && (
        <div className="w-full h-64 md:h-80 mb-12 rounded-lg overflow-hidden">
          <img
            src={`/media/${category.featuredImage.filename}`}
            alt={category.featuredImage.alt || category.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {contentItems.docs.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Content</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {contentItems.docs.map((content) => (
              <Link
                key={content.id}
                href={`/content/${content.slug}`}
                className="bg-card hover:bg-card/80 transition-colors border border-border rounded-lg overflow-hidden flex flex-col"
              >
                {content.posterImage && (
                  <div className="w-full h-40 relative">
                    <img
                      src={`/media/${content.posterImage.filename}`}
                      alt={content.posterImage.alt || content.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-medium">{content.title}</h3>
                  {content.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {content.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {validVideos.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {validVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {contentItems.docs.length === 0 && validVideos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">
            No content found in this category
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Check back later for new content</p>
        </div>
      )}
    </div>
  )
}
