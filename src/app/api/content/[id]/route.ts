import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * GET /api/content/[id]
 * 
 * Fetch a specific content item by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing content ID' },
        { status: 400 }
      )
    }
    
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Fetch the content
    const content = await payload.findByID({
      collection: 'content',
      id,
      depth: 1, // Include basic info about related documents
    })
    
    // Return the content
    return NextResponse.json(content)
  } catch (error) {
    logger.error(
      { error, context: 'content-api' },
      'Error fetching content'
    )
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
