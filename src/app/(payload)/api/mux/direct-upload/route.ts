/**
 * Mux Direct Upload API
 *
 * Creates a direct upload URL for Mux
 */

import { createPostHandler } from '@/utils/apiHandler'
import { createApiResponse } from '@/utils/apiResponse'
import { createMuxService } from '@/services/serviceFactory'

/**
 * POST /api/mux/direct-upload
 *
 * Create a direct upload URL for Mux
 */
export const POST = createPostHandler(
  async (_, body, { user }) => {
    // Get filename from request body
    const filename = body.filename || 'video-upload'

    // Log the request
    console.log('Direct upload request with filename:', filename)

    // Create direct upload
    const muxService = createMuxService()
    const upload = await muxService.createDirectUpload({
      metadata: {
        filename,
        user_id: user.id,
      },
      passthrough: {
        filename,
        user_id: user.id,
      },
    })

    console.log('Created Mux direct upload:', { uploadId: upload.uploadId, filename })

    return createApiResponse(upload)
  },
  {
    requireAuth: true,
    errorContext: 'MuxDirectUploadAPI',
  },
)
