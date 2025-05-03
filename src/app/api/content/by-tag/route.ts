import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const tag = searchParams.get('tag')
    const collection = searchParams.get('collection') || 'content' // Default to content collection
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    
    if (!tag) {
      return createErrorResponse('Tag parameter is required', 400)
    }
    
    // Only allow filtering on content or series collections
    if (collection !== 'content' && collection !== 'series') {
      return createErrorResponse('Collection must be either "content" or "series"', 400)
    }
    
    // Build the query
    const query: any = {
      collection,
      limit,
      page,
      depth: 1, // Include first level of relationships
    }
    
    // Add tag filter
    query.where = {
      'tags.value': {
        equals: tag,
      },
    }
    
    // If content collection, only show published content
    if (collection === 'content') {
      query.where.isPublished = {
        equals: true,
      }
    }
    
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find(query)
    
    return createApiResponse(result)
  } catch (error: unknown) {
    logger.error({ context: 'content/by-tag/route' }, 'Error fetching content by tag:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching content by tag',
      500
    )
  }
}
