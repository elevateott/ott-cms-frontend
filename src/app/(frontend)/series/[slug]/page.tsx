import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import React from 'react'
import Link from 'next/link'
import { ContentCard } from '@/components/ContentCard'

type PageParams = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const seriesItems = await payload.find({
    collection: 'series',
    limit: 100,
  })

  return seriesItems.docs.map((series) => ({
    slug: series.slug,
  }))
}

export async function generateMetadata({ params: paramsPromise }: PageParams): Promise<Metadata> {
  const { slug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const series = await payload.find({
    collection: 'series',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  if (!series.docs[0]) {
    return {
      title: 'Series Not Found',
      description: 'The requested series could not be found.',
    }
  }

  const seriesData = series.docs[0]

  // Use SEO metadata if available, otherwise fall back to series fields
  const title = seriesData.meta?.title || seriesData.title
  const description = seriesData.meta?.description || seriesData.description
  const image =
    seriesData.meta?.image?.url ||
    (seriesData.thumbnail && typeof seriesData.thumbnail === 'object'
      ? seriesData.thumbnail.url
      : undefined)

  // Get Twitter card settings if available
  const twitterCard = seriesData.meta?.socialMedia?.twitterCard || 'summary_large_image'
  const twitterHandle = seriesData.meta?.socialMedia?.twitterHandle

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: twitterCard as 'summary' | 'summary_large_image' | 'player',
      creator: twitterHandle || undefined,
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: seriesData.meta?.noIndex ? { index: false } : undefined,
  }
}

export default async function SeriesPage({ params: paramsPromise }: PageParams) {
  const { slug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })

  const series = await payload.find({
    collection: 'series',
    where: {
      slug: {
        equals: slug,
      },
      isPublished: {
        equals: true,
      },
    },
    limit: 1,
    depth: 1, // To get related content
  })

  if (!series.docs[0]) {
    notFound()
  }

  const seriesData = series.docs[0]
  const contentItems = seriesData.content || []

  return (
    <div className="container py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{seriesData.title}</h1>
        {seriesData.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300">{seriesData.description}</p>
        )}
        
        {seriesData.isFree && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Free
            </span>
          </div>
        )}
        
        {!seriesData.isFree && seriesData.price && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              ${seriesData.price.toFixed(2)}
            </span>
          </div>
        )}
      </header>

      {seriesData.thumbnail && (
        <div className="w-full h-64 md:h-80 mb-12 rounded-lg overflow-hidden">
          <img
            src={`/media/${seriesData.thumbnail.filename}`}
            alt={seriesData.thumbnail.alt || seriesData.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {seriesData.trailer && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Trailer</h2>
          <div className="aspect-video rounded-lg overflow-hidden">
            {/* Placeholder for video player component */}
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white">
              Trailer Video Player
            </div>
          </div>
        </section>
      )}

      {contentItems.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Episodes</h2>
          <div className={`grid grid-cols-1 ${seriesData.layout === 'list' ? '' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'} gap-6`}>
            {contentItems.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
          </div>
        </section>
      )}

      {contentItems.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300">No content in this series yet</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Check back later for new content</p>
        </div>
      )}
      
      {seriesData.creators && seriesData.creators.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Creators</h2>
          <div className="flex flex-wrap gap-4">
            {seriesData.creators.map((creator) => (
              <Link
                key={creator.id}
                href={`/creators/${creator.slug}`}
                className="flex items-center p-3 bg-card hover:bg-card/80 transition-colors border border-border rounded-lg"
              >
                {creator.avatar && (
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                    <img
                      src={`/media/${creator.avatar.filename}`}
                      alt={creator.avatar.alt || creator.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="font-medium">{creator.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      
      {seriesData.tags && seriesData.tags.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {seriesData.tags.map((tag, index) => (
              <Link
                key={`${tag.value}-${index}`}
                href={`/api/content/by-tag?tag=${encodeURIComponent(tag.value)}&collection=series`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
              >
                {tag.value}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
