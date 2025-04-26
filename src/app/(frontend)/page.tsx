import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import { ContentList } from '@/components/ContentList'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'OTT Platform - Home',
  description: 'Welcome to our OTT streaming platform',
  openGraph: {
    title: 'OTT Platform - Home',
    description: 'Welcome to our OTT streaming platform',
    type: 'website',
  },
}

export default async function HomePage() {
  const payload = await getPayload({ config: configPromise })

  // Get featured content
  const featuredContent = await payload.find({
    collection: 'content',
    limit: 4,
    sort: '-releaseDate',
  })

  // Get categories
  const categories = await payload.find({
    collection: 'categories',
    limit: 5,
    sort: 'title',
  })

  return (
    <div className="container py-12">
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Featured Content</h2>
          <Link href="/content">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        <ContentList
          initialData={featuredContent.docs}
          title=""
          emptyMessage="No featured content available yet."
        />
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Browse by Category</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.docs.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="bg-card hover:bg-card/80 transition-colors border border-border rounded-lg p-6 text-center"
            >
              <h3 className="text-lg font-medium">{category.title}</h3>
            </Link>
          ))}

          <Link
            href="/categories"
            className="bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 rounded-lg p-6 text-center"
          >
            <h3 className="text-lg font-medium text-primary">View All Categories</h3>
          </Link>
        </div>
      </section>
    </div>
  )
}
