import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const visibility = searchParams.get('visibility')
    const sort = searchParams.get('sort') || '-releaseDate'

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

    if (category) {
      where.category = {
        equals: category,
      }
    }

    if (visibility) {
      where.visibility = {
        equals: visibility,
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
    console.error('Error fetching content:', error)
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
    console.error('Error creating content:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'An error occurred while creating content',
      500,
    )
  }
}
