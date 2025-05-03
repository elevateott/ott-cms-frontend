import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * GET /api/subscription-plans/[id]
 * 
 * Fetch a specific subscription plan by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing plan ID' },
        { status: 400 }
      )
    }
    
    // Initialize Payload
    const payload = await getPayload({ config: configPromise })
    
    // Fetch the subscription plan
    const plan = await payload.findByID({
      collection: 'subscription-plans',
      id,
    })
    
    // Return the plan
    return NextResponse.json(plan)
  } catch (error) {
    logger.error(
      { error, context: 'subscription-plans-api' },
      'Error fetching subscription plan'
    )
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
