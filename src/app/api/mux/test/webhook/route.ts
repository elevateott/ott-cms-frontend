import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple test route for Mux webhooks
 * 
 * This route simply echoes back the request body to verify that the API routes are working.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    
    // Return the body as JSON
    return NextResponse.json({
      success: true,
      received: body
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
