import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import React from 'react'
import { ContentPlayer } from '@/components/ContentPlayer'
import { ContentCard } from '@/components/ContentCard'

type PageParams = {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const contentItems = await payload.find({
    collection: 'content',
    limit: 100,
  })

  return contentItems.docs.map((content) => ({
    slug: content.slug,
  }))
}

export async function generateMetadata({ params: paramsPromise }: PageParams): Promise<Metadata> {
  const { slug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })
  
  const contentItems = await payload.find({
    collection: 'content',
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const content = contentItems.docs[0]
  
  if (!content) {
    return {
      title: 'Content Not Found',
    }
  }

  return {
    title: content.title,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      type: 'video.other',
    },
  }
}

export default async function ContentPage({ params: paramsPromise }: PageParams) {
  const { slug } = await paramsPromise
  const payload = await getPayload({ config: configPromise })
  
  const contentItems = await payload.find({
    collection: 'content',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2, // Populate relationships
  })

  const content = contentItems.docs[0]
  
  if (!content) {
    notFound()
  }

  // Get related content based on category
  let relatedContent = []
  
  if (content.category) {
    const categoryId = typeof content.category === 'object' ? content.category.id : content.category
    
    const sameCategory = await payload.find({
      collection: 'content',
      where: {
        and: [
          {
            category: {
              equals: categoryId,
            },
          },
          {
            id: {
              not_equals: content.id,
            },
          },
        ],
      },
      limit: 4,
    })

    relatedContent = sameCategory.docs
  }

  return (
    <div className="container py-8">
      <div className="lg:flex lg:gap-8">
        <div className="lg:w-3/4">
          <ContentPlayer content={content} />
        </div>
        
        <div className="lg:w-1/4 mt-8 lg:mt-0">
          <h3 className="text-xl font-bold mb-4">Related Content</h3>
          
          {relatedContent.length > 0 ? (
            <div className="space-y-6">
              {relatedContent.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No related content found</p>
          )}
        </div>
      </div>
    </div>
  )
}
