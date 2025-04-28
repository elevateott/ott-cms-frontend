import { NextRequest } from 'next/server'
import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = searchParams.get('page') || 'home'
    const limit = parseInt(searchParams.get('limit') || '10')
    const now = new Date()

    // Build the query
    const query: any = {
      collection: 'carousels',
      sort: 'order',
      limit,
      depth: 2, // Include related content/series data
      where: {
        and: [
          {
            isActive: {
              equals: true,
            },
          },
          {
            showOnPages: {
              contains: page,
            },
          },
          {
            or: [
              {
                visibleFrom: {
                  exists: false,
                },
              },
              {
                visibleFrom: {
                  less_than_equal: now,
                },
              },
            ],
          },
          {
            or: [
              {
                visibleUntil: {
                  exists: false,
                },
              },
              {
                visibleUntil: {
                  greater_than: now,
                },
              },
            ],
          },
        ],
      },
    }

    const payload = await getPayload({ config: configPromise })
    const result = await payload.find(query)

    // Process the results to ensure items are sorted by order
    const processedResults = {
      ...result,
      docs: result.docs.map(carousel => ({
        ...carousel,
        items: carousel.items
          ? [...carousel.items].sort((a, b) => a.order - b.order)
          : [],
      })),
    }

    return createApiResponse(processedResults)
  } catch (error: unknown) {
    logger.error({ context: 'carousels/route' }, 'Error fetching carousels:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while fetching carousels',
      500,
    )
  }
}
