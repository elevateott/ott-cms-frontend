import { NextResponse } from 'next/server'
import { createMuxService } from '@/services/mux/index'
import { logError } from '@/utils/errorHandler'

export async function POST(request: Request) {
  try {
    const muxService = createMuxService()

    // Get the filename from the request body
    const body = await request.json()
    const { filename } = body

    const upload = await muxService.createDirectUpload({
      ...(filename ? { metadata: { filename } } : {}),
    })

    // The Mux upload response should contain both the URL and upload ID
    return NextResponse.json({
      success: true,
      data: {
        url: upload.url,
        uploadId: upload.uploadId,
      },
    })
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
