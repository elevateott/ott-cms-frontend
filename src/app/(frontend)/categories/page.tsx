import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse all content categories',
}

export default async function CategoriesPage() {
  const payload = await getPayload({ config: configPromise })
  
  const categories = await payload.find({
    collection: 'categories',
    sort: 'title',
  })

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Categories</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.docs.map((category) => (
          <Link 
            key={category.id} 
            href={`/category/${category.slug}`}
            className="bg-card hover:bg-card/80 transition-colors border border-border rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-2">{category.title}</h2>
            {category.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {category.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
