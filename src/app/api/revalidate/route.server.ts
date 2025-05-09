import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route for revalidating paths and tags
 * This allows server components to revalidate content via API calls
 * instead of directly importing revalidateTag/revalidatePath
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Get path and tag from query parameters
    const path = searchParams.get('path')
    const tag = searchParams.get('tag')
    
    // Revalidate path if provided
    if (path) {
      revalidatePath(path)
    }
    
    // Revalidate tag if provided
    if (tag) {
      revalidateTag(tag)
    }
    
    // Return success response
    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      path: path || null,
      tag: tag || null
    })
  } catch (error) {
    // Return error response
    return NextResponse.json({
      revalidated: false,
      now: Date.now(),
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
