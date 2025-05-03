import { logger } from '@/utils/logger'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const sort = searchParams.get('sort') || '-releaseDate'

    // Get filter parameters
    const category = searchParams.get('category')
    const categories = searchParams.getAll('categories')
    const creator = searchParams.get('creator')
    const creators = searchParams.getAll('creators')
    const tag = searchParams.get('tag')
    const tags = searchParams.getAll('tags')
    const series = searchParams.get('series')
    const visibility = searchParams.get('visibility')
    const isPublished = searchParams.get('isPublished') !== 'false' // Default to true

    // Build the query
    const query: any = {
      collection: 'content',
      page,
      limit,
      sort,
      depth: 1, // Populate first level of relationships
    }

    // Add filters if provided
    const where: any = {}
    const andConditions: any[] = []

    // Handle category filters
    if (category) {
      // Support legacy single category parameter
      andConditions.push({
        categories: {
          contains: category,
        },
      })
    }

    if (categories && categories.length > 0) {
      // Support multiple categories (ANY match)
      andConditions.push({
        categories: {
          in: categories,
        },
      })
    }

    // Handle creator filters
    if (creator) {
      // Support legacy single creator parameter
      andConditions.push({
        creators: {
          contains: creator,
        },
      })
    }

    if (creators && creators.length > 0) {
      // Support multiple creators (ANY match)
      andConditions.push({
        creators: {
          in: creators,
        },
      })
    }

    // Handle tag filters
    if (tag) {
      // Support legacy single tag parameter
      andConditions.push({
        'tags.value': {
          equals: tag,
        },
      })
    }

    if (tags && tags.length > 0) {
      // Support multiple tags (ANY match)
      const tagConditions = tags.map((tagValue) => ({
        'tags.value': {
          equals: tagValue,
        },
      }))

      andConditions.push({
        or: tagConditions,
      })
    }

    // Handle series filter
    if (series) {
      andConditions.push({
        series: {
          equals: series,
        },
      })
    }

    // Handle visibility filter
    if (visibility) {
      andConditions.push({
        visibility: {
          equals: visibility,
        },
      })
    }

    // Handle published state
    andConditions.push({
      isPublished: {
        equals: isPublished,
      },
    })

    // Add all conditions to the where clause
    if (andConditions.length > 0) {
      where.and = andConditions
    }

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find(query)

    return createApiResponse(result)
  } catch (error: unknown) {
    logger.error({ context: 'content/route' }, 'Error fetching content:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching content',
      500,
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()

    const result = await payload.create({
      collection: 'content',
      data: body,
    })

    return createApiResponse(result, 201)
  } catch (error: unknown) {
    logger.error({ context: 'content/route' }, 'Error creating content:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while creating content',
      500,
    )
  }
}
