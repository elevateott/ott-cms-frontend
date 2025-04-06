// src/app/(frontend)/category/[slug]/page.tsx
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import React from 'react'
import { VideoCard } from '@/components/VideoCard'

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

export async function generateMetadata({ params }) {
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

export default async function CategoryPage({ params }) {
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

  return (
    <div className="container py-12">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{category.title}</h1>
        {category.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300">{category.description}</p>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.docs.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}

        {videos.docs.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No videos in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
