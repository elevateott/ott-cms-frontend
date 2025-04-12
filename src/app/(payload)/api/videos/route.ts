/**
 * Videos API
 *
 * Provides endpoints for fetching videos
 */

import { NextRequest } from 'next/server'
import { createGetHandler, createPostHandler } from '@/utils/apiHandler'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { createVideoRepository } from '@/services/serviceFactory'
import { PAGINATION } from '@/constants'

/**
 * GET /api/videos
 *
 * Fetch videos with pagination and filtering
 */
export const GET = createGetHandler(
  async (req, { payload }) => {
    // Get query parameters
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = parseInt(url.searchParams.get('limit') || String(PAGINATION.DEFAULT_LIMIT), 10)
    const sort = url.searchParams.get('sort') || '-createdAt'
    const category = url.searchParams.get('category') || undefined
    const featured = url.searchParams.get('featured') === 'true'

    // Create video repository
    const videoRepository = createVideoRepository(payload)

    // Build where clause
    const where: Record<string, any> = {}

    if (category) {
      where.category = {
        equals: category,
      }
    }

    if (featured) {
      where.featured = {
        equals: true,
      }
    }

    // Fetch videos
    const result = await videoRepository.find({
      page,
      limit,
      sort,
      where: Object.keys(where).length > 0 ? where : undefined,
      depth: 1, // Include related data one level deep
    })

    return createApiResponse(result)
  },
  {
    errorContext: 'VideosAPI.GET',
  },
)

/**
 * POST /api/videos
 *
 * Create a new video
 */
export const POST = createPostHandler(
  async (req, body, { user, payload }) => {
    // Validate request body
    if (!body.title) {
      return createErrorResponse('Missing required field: title', 400)
    }

    // Create video repository
    const videoRepository = createVideoRepository(payload)

    // Create video
    const video = await videoRepository.create({
      ...body,
      // Set default values
      publishedAt: body.publishedAt || new Date().toISOString(),
    })

    if (!video) {
      return createErrorResponse('Failed to create video', 500)
    }

    return createApiResponse(video, {
      message: 'Video created successfully',
      status: 201,
    })
  },
  {
    requireAuth: true,
    errorContext: 'VideosAPI.POST',
  },
)

