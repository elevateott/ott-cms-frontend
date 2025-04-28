import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Categories | OTT Platform',
  description: 'Browse all content categories and series',
  openGraph: {
    title: 'Categories | OTT Platform',
    description: 'Browse all content categories and series',
    type: 'website',
  },
}

export default async function CategoriesPage() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    sort: 'title',
    where: {
      showInCatalog: {
        equals: true,
      },
    },
  })

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Categories</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.docs.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="bg-card hover:bg-card/80 transition-colors border border-border rounded-lg overflow-hidden flex flex-col"
          >
            {category.featuredImage && (
              <div className="w-full h-40 relative">
                <img
                  src={`/media/${category.featuredImage.filename}`}
                  alt={category.featuredImage.alt || category.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{category.title}</h2>
              {category.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
              )}
              {category.featuredCategory && (
                <div className="mt-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    Featured
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
