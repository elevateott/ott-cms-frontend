import { Metadata, ResolvingMetadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'
import { ContentCard } from '@/components/ContentCard'

type Props = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params: paramsPromise }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await paramsPromise
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
    title: `${category.title} - Content`,
    description: category.description,
  }
}

export default async function CategoryContentPage(props: Props) {
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
      category: {
        equals: category.id,
      },
      visibility: {
        not_equals: 'private',
      },
    },
    sort: '-releaseDate',
  })

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.title}</h1>
        {category.description && <p className="text-lg text-gray-600">{category.description}</p>}
      </div>

      {contentItems.docs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {contentItems.docs.map((content) => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-600">No content found in this category</h3>
          <p className="mt-2 text-gray-500">Check back later for new content</p>
        </div>
      )}
    </div>
  )
}
