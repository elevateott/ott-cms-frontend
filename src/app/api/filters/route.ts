import { NextRequest } from 'next/server'
import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const group = searchParams.get('group')
    const isActive = searchParams.get('isActive') !== 'false' // Default to true
    
    // Build the query
    const query: any = {
      collection: 'filters',
      sort: 'order',
      limit: 100,
    }
    
    // Add filters if provided
    const where: any = {}
    
    if (type) {
      where.type = {
        equals: type,
      }
    }
    
    if (group) {
      where.group = {
        equals: group,
      }
    }
    
    if (isActive !== undefined) {
      where.isActive = {
        equals: isActive,
      }
    }
    
    // Only add where clause if we have filters
    if (Object.keys(where).length > 0) {
      query.where = where
    }
    
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find(query)
    
    return createApiResponse(result)
  } catch (error: unknown) {
    logger.error({ context: 'filters/route' }, 'Error fetching filters:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching filters',
      500,
    )
  }
}

// Helper endpoint to get all available filter options
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    
    // Get the requested filter types
    const { types = ['category', 'creator', 'tag', 'series'] } = body
    
    const response: Record<string, any> = {}
    
    // Get categories
    if (types.includes('category')) {
      const categories = await payload.find({
        collection: 'categories',
        sort: 'title',
        where: {
          showInCatalog: {
            equals: true,
          },
        },
        limit: 100,
      })
      
      response.categories = categories.docs.map(category => ({
        id: category.id,
        label: category.title,
        value: category.id,
        slug: category.slug,
      }))
    }
    
    // Get creators
    if (types.includes('creator')) {
      const creators = await payload.find({
        collection: 'creators',
        sort: 'name',
        where: {
          publicProfile: {
            equals: true,
          },
        },
        limit: 100,
      })
      
      response.creators = creators.docs.map(creator => ({
        id: creator.id,
        label: creator.name,
        value: creator.id,
        slug: creator.slug,
      }))
    }
    
    // Get tags
    if (types.includes('tag')) {
      // Get all content with tags
      const contentQuery: any = {
        collection: 'content',
        limit: 100,
        depth: 0,
        where: {
          'tags.0': {
            exists: true,
          },
        },
      }
      
      // Get all series with tags
      const seriesQuery: any = {
        collection: 'series',
        limit: 100,
        depth: 0,
        where: {
          'tags.0': {
            exists: true,
          },
        },
      }
      
      const [contentResult, seriesResult] = await Promise.all([
        payload.find(contentQuery),
        payload.find(seriesQuery),
      ])
      
      // Extract unique tags
      const allTags = new Set<string>()
      
      // Process content tags
      contentResult.docs.forEach(content => {
        if (Array.isArray(content.tags)) {
          content.tags.forEach(tag => {
            if (tag && tag.value) {
              allTags.add(tag.value)
            }
          })
        }
      })
      
      // Process series tags
      seriesResult.docs.forEach(series => {
        if (Array.isArray(series.tags)) {
          series.tags.forEach(tag => {
            if (tag && tag.value) {
              allTags.add(tag.value)
            }
          })
        }
      })
      
      // Convert to array and sort
      response.tags = Array.from(allTags)
        .sort()
        .map(tag => ({
          label: tag,
          value: tag,
        }))
    }
    
    // Get series
    if (types.includes('series')) {
      const series = await payload.find({
        collection: 'series',
        sort: 'title',
        where: {
          isPublished: {
            equals: true,
          },
        },
        limit: 100,
      })
      
      response.series = series.docs.map(s => ({
        id: s.id,
        label: s.title,
        value: s.id,
        slug: s.slug,
      }))
    }
    
    return createApiResponse(response)
  } catch (error: unknown) {
    logger.error({ context: 'filters/route' }, 'Error fetching filter options:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching filter options',
      500,
    )
  }
}
