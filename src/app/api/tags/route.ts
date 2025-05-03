import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const collection = searchParams.get('collection') // Optional filter by collection
    
    const payload = await getPayload({ config: configPromise })
    
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
    
    // Execute queries based on collection filter
    let contentResult = { docs: [] }
    let seriesResult = { docs: [] }
    
    if (!collection || collection === 'content') {
      contentResult = await payload.find(contentQuery)
    }
    
    if (!collection || collection === 'series') {
      seriesResult = await payload.find(seriesQuery)
    }
    
    // Extract and deduplicate tags
    const allTags = new Set<string>()
    
    // Process content tags
    contentResult.docs.forEach((content: any) => {
      if (content.tags && Array.isArray(content.tags)) {
        content.tags.forEach((tag: any) => {
          if (tag.value) {
            allTags.add(tag.value)
          }
        })
      }
    })
    
    // Process series tags
    seriesResult.docs.forEach((series: any) => {
      if (series.tags && Array.isArray(series.tags)) {
        series.tags.forEach((tag: any) => {
          if (tag.value) {
            allTags.add(tag.value)
          }
        })
      }
    })
    
    // Convert to sorted array
    const uniqueTags = Array.from(allTags).sort()
    
    return createApiResponse({
      tags: uniqueTags,
      count: uniqueTags.length,
    })
  } catch (error: unknown) {
    logger.error({ context: 'tags/route' }, 'Error fetching tags:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching tags',
      500
    )
  }
}
