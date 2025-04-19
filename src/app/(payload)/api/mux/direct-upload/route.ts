import { NextResponse } from 'next/server'
import { createMuxService } from '@/services/mux/index'
import { logError } from '@/utils/errorHandler'

export async function POST(request: Request) {
  try {
    console.log('direct-upload API endpoint called')
    const muxService = createMuxService()

    // Get the filename from the request body
    const body = await request.json()
    const { filename } = body
    console.log('Received request with filename:', filename)

    console.log('Creating direct upload with Mux service')
    const upload = await muxService.createDirectUpload({
      ...(filename ? { metadata: { filename } } : {}),
    })
    console.log('Mux direct upload created:', { uploadId: upload.uploadId })

    // The Mux upload response should contain both the URL and upload ID
    const response = {
      success: true,
      data: {
        url: upload.url,
        uploadId: upload.uploadId,
      },
    }
    console.log('Returning response:', {
      ...response,
      data: { ...response.data, url: '(url hidden)' },
    })
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in direct upload endpoint:', error)
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
