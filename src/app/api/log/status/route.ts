/**
 * Log Status API
 * 
 * This API endpoint returns the status of the logging system.
 * It's used by the client logger to check if the server is available.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Log that the status endpoint was called
    logger.info(
      { context: 'LogStatusAPI' },
      'Log status endpoint called'
    )

    // Return a success response
    return NextResponse.json({
      success: true,
      status: 'available',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      logLevel: process.env.LOG_LEVEL || 'info',
      enableRemoteLogging: process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOGGING === 'true'
    })
  } catch (error) {
    // Log the error
    logger.error(
      {
        err: error instanceof Error ? error : new Error('Unknown error'),
        context: 'LogStatusAPI',
      },
      'Error checking log status'
    )

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
