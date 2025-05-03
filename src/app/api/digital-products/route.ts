import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * GET /api/digital-products
 * 
 * Fetch digital products with optional filtering and pagination
 * 
 * Query parameters:
 * - limit: Number of products to return (default: 10)
 * - page: Page number for pagination (default: 1)
 * - sort: Field to sort by (default: -createdAt)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const sort = searchParams.get('sort') || '-createdAt'
    
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Fetch digital products
    const result = await payload.find({
      collection: 'digital-products',
      limit,
      page,
      sort,
    })
    
    // Return the result
    return NextResponse.json(result)
  } catch (error) {
    logger.error(
      { error, context: 'digital-products-api' },
      'Error fetching digital products'
    )
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
