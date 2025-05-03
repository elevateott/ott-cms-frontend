import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/getSessionUser'
import { checkAccessForProduct } from '@/lib/access/checkAccessForProduct'
import { logger } from '@/utils/logger'

/**
 * GET /api/products/check-access
 * 
 * Check if the current user has access to a digital product
 * 
 * Query parameters:
 * - productId: ID of the digital product to check access for
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    
    // Get the current user
    const user = await getSessionUser()
    
    if (!productId || !user?.email) {
      return NextResponse.json({ hasAccess: false })
    }
    
    // Check access
    const hasAccess = await checkAccessForProduct({
      userEmail: user.email,
      productId,
    })
    
    // Return the result
    return NextResponse.json({ hasAccess })
  } catch (error) {
    logger.error(
      { error, context: 'products-check-access' },
      'Error checking product access'
    )
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
