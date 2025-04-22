import { logger } from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const featuredOn = searchParams.get('featuredOn')
    const parentCategory = searchParams.get('parentCategory')
    
    // Build the query
    const query: any = {
      collection: 'categories',
      sort: 'order',
    }
    
    // Add filters if provided
    const where: any = {}
    
    if (featuredOn) {
      where.featuredOn = {
        in: [featuredOn, 'both'],
      }
    }
    
    if (parentCategory) {
      where.parentCategory = {
        equals: parentCategory,
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
    logger.error({ context: 'categories/route' }, 'Error fetching categories:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching categories',
      500
    )
  }
}
