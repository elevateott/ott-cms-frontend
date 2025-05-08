import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

/**
 * GET /api/cloud-integrations/dropbox-key
 *
 * Returns just the Dropbox app key for faster loading
 * This is a simplified version that returns a clear error message
 */
export async function GET() {
  try {
    logger.info({ context: 'dropboxKeyAPI' }, 'Received request for Dropbox app key')

    // Return a clear error message with 200 status
    return NextResponse.json(
      {
        dropboxAppKey: null,
        configured: false,
        error: 'The cloud-integrations global does not exist in Payload CMS',
        details: 'Please create the cloud-integrations global in Payload CMS with a dropboxAppKey field'
      },
      { status: 200 },
    )
  } catch (error) {
    // Extract more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    logger.error(
      { 
        context: 'dropboxKeyAPI', 
        error: errorMessage
      }, 
      'Error in dropbox-key API route'
    )

    // Return a clear error message with 200 status
    return NextResponse.json(
      {
        dropboxAppKey: null,
        configured: false,
        error: `Failed to fetch Dropbox app key: ${errorMessage}`,
        details: 'Please ensure the cloud-integrations global exists and contains a valid Dropbox app key.'
      },
      { status: 200 },
    )
  }
}
