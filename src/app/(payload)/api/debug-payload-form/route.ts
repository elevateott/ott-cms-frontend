/**
 * Debug Payload Form API
 * 
 * This endpoint helps debug issues with Payload CMS form submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/utils/errorHandler'

/**
 * POST /api/debug-payload-form
 * 
 * Debug endpoint for Payload CMS form submissions
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body as text first
    const bodyText = await req.text()
    console.log('Debug Payload Form - Request Body Text:', bodyText)
    
    // Try to parse the body as JSON
    let body
    try {
      body = JSON.parse(bodyText)
      console.log('Debug Payload Form - Request Body JSON:', JSON.stringify(body, null, 2))
    } catch (parseError) {
      console.error('Error parsing request body as JSON:', parseError)
      return NextResponse.json({
        success: false,
        message: 'Failed to parse request body as JSON',
        error: parseError.message,
        bodyText,
      }, { status: 400 })
    }
    
    // Get the headers
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    
    // Return the request details
    return NextResponse.json({
      success: true,
      message: 'Request details captured',
      method: req.method,
      url: req.url,
      headers,
      body,
    })
  } catch (error) {
    logError(error, 'DebugPayloadFormAPI')
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error.message,
    }, { status: 500 })
  }
}
