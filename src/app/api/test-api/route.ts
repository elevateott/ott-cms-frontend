import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

/**
 * GET /api/test-api
 *
 * Simple test endpoint to verify API routes are working
 */
export async function GET() {
  try {
    logger.info(
      { context: 'testAPI' },
      'Test API endpoint called',
    )

    return NextResponse.json({
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      {
        context: 'testAPI',
        error: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace',
      },
      'Error in test API endpoint',
    )

    return NextResponse.json(
      {
        success: false,
        error: `Error in test API: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
