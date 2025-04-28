import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { FilterableContentList } from '@/components/FilterableContentList'
import { CarouselsContainer } from '@/components/CarouselsContainer'

export const metadata: Metadata = {
  title: 'Content Library | OTT Platform',
  description: 'Browse our collection of videos, movies, and shows',
  openGraph: {
    title: 'Content Library | OTT Platform',
    description: 'Browse our collection of videos, movies, and shows',
    type: 'website',
  },
}

export default async function ContentLibraryPage() {
  const payload = await getPayload({ config: configPromise })

  // Get carousels for the content page
  const carouselsResult = await payload.find({
    collection: 'carousels',
    sort: 'order',
    where: {
      and: [
        {
          isActive: {
            equals: true,
          },
        },
        {
          showOnPages: {
            contains: 'content',
          },
        },
      ],
    },
    depth: 2, // Include related content/series data
  })

  // Get initial content items
  const contentItems = await payload.find({
    collection: 'content',
    limit: 12,
    sort: '-releaseDate',
    where: {
      isPublished: {
        equals: true,
      },
    },
  })

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Content Library</h1>

      {/* Dynamic Carousels */}
      {carouselsResult.docs.length > 0 && (
        <div className="mb-12">
          <CarouselsContainer page="content" initialData={carouselsResult.docs} />
        </div>
      )}

      {/* Filterable Content List */}
      <FilterableContentList
        initialData={contentItems.docs}
        apiEndpoint="/api/content"
        title="All Content"
        emptyMessage="No content available yet. Check back soon!"
      />
    </div>
  )
}
