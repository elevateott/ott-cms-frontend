import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * GET /api/addons
 * 
 * Get a list of available add-ons
 */
export async function GET(request: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    
    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const page = parseInt(url.searchParams.get('page') || '1')
    
    // Fetch add-ons
    const addons = await payload.find({
      collection: 'addons',
      where: {
        isActive: {
          equals: true,
        },
      },
      sort: 'order',
      limit,
      page,
    })
    
    return NextResponse.json(addons)
  } catch (error) {
    logger.error(
      { error, context: 'api-addons-get' },
      'Error fetching add-ons',
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
