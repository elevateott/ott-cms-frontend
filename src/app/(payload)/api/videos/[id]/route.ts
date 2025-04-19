/**
 * Video by ID API
 *
 * Provides endpoints for fetching, updating, and deleting a single video
 */

import { NextRequest as _NextRequest } from 'next/server'
import { createGetHandler, createPutHandler, createDeleteHandler } from '@/utils/apiHandler'
import { createApiResponse, createErrorResponse, createNotFoundResponse } from '@/utils/apiResponse'
import { createVideoRepository } from '@/services/serviceFactory'

/**
 * GET /api/videos/[id]
 *
 * Fetch a single video by ID
 */
export const GET = createGetHandler(
  async (req, { payload }) => {
    // Get video ID from URL
    const id = req.url.split('/').pop()

    if (!id) {
      return createErrorResponse('Missing video ID', 400)
    }

    // Create video repository
    const videoRepository = createVideoRepository(payload)

    // Fetch video
    const video = await videoRepository.findById(id)

    if (!video) {
      return createNotFoundResponse('Video not found')
    }

    return createApiResponse(video)
  },
  {
    errorContext: 'VideoByIdAPI.GET',
  },
)

/**
 * PUT /api/videos/[id]
 *
 * Update a video by ID
 */
export const PUT = createPutHandler(
  async (req, body, { payload }) => {
    // Get video ID from URL
    const id = req.url.split('/').pop()

    if (!id) {
      return createErrorResponse('Missing video ID', 400)
    }

    // Create video repository
    const videoRepository = createVideoRepository(payload)

    // Check if video exists
    const existingVideo = await videoRepository.findById(id)

    if (!existingVideo) {
      return createNotFoundResponse('Video not found')
    }

    // Update video
    const updatedVideo = await videoRepository.update(id, body)

    if (!updatedVideo) {
      return createErrorResponse('Failed to update video', 500)
    }

    return createApiResponse(updatedVideo, {
      message: 'Video updated successfully',
    })
  },
  {
    requireAuth: true,
    errorContext: 'VideoByIdAPI.PUT',
  },
)

/**
 * DELETE /api/videos/[id]
 *
 * Delete a video by ID
 */
export const DELETE = createDeleteHandler(
  async (req, { payload }) => {
    // Get video ID from URL
    const id = req.url.split('/').pop()

    if (!id) {
      return createErrorResponse('Missing video ID', 400)
    }

    // Create video repository
    const videoRepository = createVideoRepository(payload)

    // Check if video exists
    const existingVideo = await videoRepository.findById(id)

    if (!existingVideo) {
      return createNotFoundResponse('Video not found')
    }

    // Delete video
    const success = await videoRepository.delete(id)

    if (!success) {
      return createErrorResponse('Failed to delete video', 500)
    }

    return createApiResponse(null, {
      message: 'Video deleted successfully',
    })
  },
  {
    requireAuth: true,
    errorContext: 'VideoByIdAPI.DELETE',
  },
)
