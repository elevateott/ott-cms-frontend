import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { FilterableContentList } from '@/components/FilterableContentList'

export const metadata: Metadata = {
  title: 'Series Library | OTT Platform',
  description: 'Browse our collection of series and shows',
  openGraph: {
    title: 'Series Library | OTT Platform',
    description: 'Browse our collection of series and shows',
    type: 'website',
  },
}

export default async function SeriesLibraryPage() {
  const payload = await getPayload({ config: configPromise })

  // Get initial series items
  const seriesItems = await payload.find({
    collection: 'series',
    limit: 12,
    sort: '-createdAt',
    where: {
      isPublished: {
        equals: true,
      },
    },
  })

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Series Library</h1>

      <FilterableContentList
        initialData={seriesItems.docs}
        apiEndpoint="/api/series"
        title="All Series"
        emptyMessage="No series available yet. Check back soon!"
      />
    </div>
  )
}
