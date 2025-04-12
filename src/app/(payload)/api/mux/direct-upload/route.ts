import { NextResponse } from 'next/server'
import { createMuxService } from '@/services/mux'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { filename } = body

    console.log(`Direct upload request with filename: ${filename}`)
    console.log('MUX ENV Variables:', {
      tokenId: process.env.MUX_TOKEN_ID?.substring(0, 8) + '...',
      hasSecret: !!process.env.MUX_TOKEN_SECRET
    })

    let muxService
    try {
      muxService = createMuxService()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Failed to initialize Mux service:', error)
      return NextResponse.json(
        { error: 'Mux service configuration error: ' + errorMessage },
        { status: 500 }
      )
    }

    const upload = await muxService.createDirectUpload({
      corsOrigin: '*',
      newAssetSettings: {
        playbackPolicy: ['public'],
      },
      metadata: {
        filename: filename || 'untitled',
      },
    })

    return NextResponse.json(upload)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error creating Mux upload:', error)
    return NextResponse.json(
      { error: errorMessage || 'Failed to create upload URL' },
      { status: 500 }
    )
  }
}




