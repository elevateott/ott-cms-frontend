import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { getCloudIntegrations } from '@/utilities/getCloudIntegrations'

/**
 * GET /api/cloud-integrations
 *
 * Returns cloud integration settings from global configuration
 * Uses the updated getCloudIntegrations utility that properly initializes Payload
 */
export async function GET() {
  try {
    logger.info(
      { context: 'cloudIntegrationsAPI' },
      'Received request for cloud integration settings',
    )

    // Use the utility function to get cloud integration settings
    const cloudIntegrations = await getCloudIntegrations()

    logger.info({ context: 'cloudIntegrationsAPI' }, 'Returning cloud integration settings')
    return NextResponse.json(cloudIntegrations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    logger.error(
      {
        context: 'cloudIntegrationsAPI',
        error: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace',
      },
      'Error fetching cloud integration settings',
    )

    return NextResponse.json(
      {
        dropboxAppKey: null,
        googleApiKey: null,
        googleClientId: null,
        error: `Failed to fetch cloud integration settings: ${errorMessage}`,
        details: 'Please ensure the cloud-integrations global exists in Payload CMS',
      },
      { status: 200 }, // Return 200 to prevent client from getting stuck
    )
  }
}
