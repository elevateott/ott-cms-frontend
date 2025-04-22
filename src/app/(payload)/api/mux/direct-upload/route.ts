import { logger } from '@/utils/logger';
import { NextResponse } from 'next/server'
import { createMuxService } from '@/services/mux/index'
import { logError } from '@/utils/errorHandler'

export async function POST(request: Request) {
  try {
    logger.info({ context: 'direct-upload/route' }, 'direct-upload API endpoint called')
    const muxService = createMuxService()

    // Get the filename from the request body
    const body = await request.json()
    const { filename } = body
    logger.info({ context: 'direct-upload/route' }, 'Received request with filename:', filename)

    logger.info({ context: 'direct-upload/route' }, 'Creating direct upload with Mux service')
    const upload = await muxService.createDirectUpload({
      ...(filename ? { metadata: { filename } } : {}),
    })
    logger.info({ context: 'direct-upload/route' }, 'Mux direct upload created:', { uploadId: upload.uploadId })

    // The Mux upload response should contain both the URL and upload ID
    const response = {
      success: true,
      data: {
        url: upload.url,
        uploadId: upload.uploadId,
      },
    }
    logger.info({ context: 'direct-upload/route' }, 'Returning response:', {
      ...response,
      data: { ...response.data, url: '(url hidden)' },
    })
    return NextResponse.json(response)
  } catch (error) {
    logger.error({ context: 'direct-upload/route' }, 'Error in direct upload endpoint:', error)
    logError(error, 'MuxDirectUpload.POST')

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'An unknown error occurred'
            : 'Failed to create upload URL',
      },
      { status: 500 },
    )
  }
}
