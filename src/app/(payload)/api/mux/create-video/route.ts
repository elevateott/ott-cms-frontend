/**
 * Create Video API
 *
 * Creates a video document with the upload ID
 */

import { createPostHandler } from '@/utils/apiHandler'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { createVideoRepository } from '@/services/serviceFactory'
import { validateRequiredFields } from '@/utils/validation'
import { removeFileExtension } from '@/utils/string'

/**
 * POST /api/mux/create-video
 *
 * Create a video document with the upload ID
 */
export const POST = createPostHandler(
  async (_, body, { payload }) => {
    // Validate required fields
    const { isValid, missingFields } = validateRequiredFields(body, ['uploadId', 'filename'])
    if (!isValid) {
      return createErrorResponse(`Missing required fields: ${missingFields.join(', ')}`, 400)
    }

    const { uploadId, filename } = body

    // Process the filename to create a title
    const title = removeFileExtension(filename)

    console.log(`Creating video document with uploadId ${uploadId} and title ${title}`)

    // Create a video repository
    const videoRepository = createVideoRepository(payload)

    // Check if a video with this uploadId already exists
    const existingVideo = await videoRepository.findByMuxUploadId(uploadId)
    if (existingVideo) {
      return createApiResponse({
        message: 'Video already exists',
        video: existingVideo,
      })
    }

    // Create a new video document
    const video = await videoRepository.create({
      title,
      sourceType: 'mux',
      muxData: {
        uploadId,
        status: 'uploading',
      },
      publishedAt: new Date().toISOString(),
    })

    if (!video) {
      return createErrorResponse('Failed to create video', 500)
    }

    console.log(`Created new video document with uploadId ${uploadId}:`, video.id)

    return createApiResponse({
      message: 'Video created successfully',
      video,
    })
  },
  {
    requireAuth: true,
    errorContext: 'CreateVideoAPI',
  },
)
