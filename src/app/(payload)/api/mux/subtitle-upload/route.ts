import { logger } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { logError } from '@/utils/errorHandler'

/**
 * POST /api/mux/subtitle-upload
 * 
 * Upload a subtitle file to the server and get a URL to use with Mux
 */
export async function POST(request: NextRequest) {
  try {
    logger.info({ context: 'subtitle-upload/route' }, 'Uploading subtitle file')

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Authenticate the request
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Get the form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return createErrorResponse('No file provided', 400)
    }

    // Validate file type
    const validTypes = ['.vtt', '.srt', 'text/vtt', 'application/x-subrip']
    const fileType = file.type
    const fileName = file.name
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
    
    if (!validTypes.some(type => 
      fileType.includes(type) || fileExtension.includes(type)
    )) {
      return createErrorResponse('Invalid file type. Only .vtt and .srt files are supported.', 400)
    }

    // Upload the file to the media library
    const media = await payload.create({
      collection: 'media',
      data: {},
      file,
    })

    if (!media || !media.url) {
      return createErrorResponse('Failed to upload subtitle file', 500)
    }

    // Return the URL to the uploaded file
    return createApiResponse(
      { url: media.url },
      {
        message: 'Subtitle file uploaded successfully',
        status: 201,
      }
    )
  } catch (error) {
    logError(error, 'subtitle-upload/route.POST')
    return createErrorResponse(
      `Failed to upload subtitle file: ${error instanceof Error ? error.message : String(error)}`,
      500
    )
  }
}
