import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'

/**
 * GET /api/direct-cloud-integrations
 *
 * Returns cloud integration settings directly from environment variables or hardcoded values
 * This is a fallback for when the Payload CMS global is not available
 */
export async function GET() {
  try {
    logger.info(
      { context: 'directCloudIntegrationsAPI' },
      'Received request for direct cloud integration settings',
    )

    // Return the hardcoded values from the test page
    const cloudIntegrations = {
      dropboxAppKey: 'o8wxu9m9b3o2m8d',
      googleClientId: '226170616436-86a0lrmluoqdrfnjtirj64kfl22kogto.apps.googleusercontent.com',
    }

    logger.info(
      { context: 'directCloudIntegrationsAPI' },
      'Returning direct cloud integration settings',
    )
    
    return NextResponse.json(cloudIntegrations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      {
        context: 'directCloudIntegrationsAPI',
        error: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace',
      },
      'Error in direct cloud integration settings API',
    )

    return NextResponse.json(
      {
        dropboxAppKey: null,
        googleClientId: null,
        error: `Failed to get direct cloud integration settings: ${errorMessage}`,
      },
      { status: 200 }, // Return 200 to prevent client from getting stuck
    )
  }
}
