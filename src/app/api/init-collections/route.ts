import { logger } from '@/utils/logger';
import { NextResponse } from 'next/server'
import payload from 'payload'

export async function POST() {
  try {
    // Check if collection already exists
    const collections = await payload.collections
    if (collections['ott-videos']) {
      return NextResponse.json({ 
        success: true, 
        message: 'Collection already exists' 
      })
    }

    // Create the collection
    await payload.create({
      collection: 'ott-videos',
      data: {
        slug: 'ott-videos',
        fields: [
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'sourceType',
            type: 'text',
            required: true,
          },
          {
            name: 'muxData',
            type: 'json',
            required: false,
          },
          {
            name: 'muxThumbnailUrl',
            type: 'text',
            required: false,
          },
          {
            name: 'duration',
            type: 'number',
            required: false,
          },
          {
            name: 'aspectRatio',
            type: 'text',
            required: false,
          }
        ],
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Collection created successfully' 
    })
  } catch (error) {
    logger.error({ context: 'init-collections/route' }, 'Error initializing collections:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}