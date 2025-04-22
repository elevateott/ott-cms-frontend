/**
 * Client Log API
 * 
 * This API endpoint receives logs from the client-side logger
 * and forwards them to the server-side logger.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { ClientLogData } from '@/utils/clientLogger'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse the log data from the request
    const logData: ClientLogData = await req.json()
    
    // Extract the log data
    const { level, message, context, data, userAgent, url } = logData
    
    // Create a context string that includes the client info
    const clientContext = context 
      ? `${context} (Client)`
      : 'Client'
    
    // Add client-specific data
    const clientData = {
      ...data,
      client: {
        userAgent,
        url,
      },
    }
    
    // Log using the appropriate level
    switch (level) {
      case 'info':
        logger.info({ context: clientContext, ...clientData }, message)
        break
      case 'warn':
        logger.warn({ context: clientContext, ...clientData }, message)
        break
      case 'error':
        logger.error({ context: clientContext, ...clientData }, message)
        break
      case 'debug':
        logger.debug({ context: clientContext, ...clientData }, message)
        break
      default:
        // Default to info level if unknown
        logger.info({ context: clientContext, ...clientData, level }, message)
    }
    
    // Return a success response
    return NextResponse.json({ success: true })
  } catch (error) {
    // Log the error
    logger.error(
      { 
        err: error instanceof Error ? error : new Error('Unknown error'),
        context: 'ClientLogAPI',
      }, 
      'Error processing client log'
    )
    
    // Return an error response
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}
