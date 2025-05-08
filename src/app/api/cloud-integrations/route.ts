import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { getCloudIntegrations } from '@/utilities/getCloudIntegrations'

/**
 * GET /api/cloud-integrations
 *
 * Returns cloud integration settings from global configuration
 * Uses the updated getCloudIntegrations utility that properly initializes Payload
 * Fails gracefully if settings are not configured
 */
export async function GET() {
  try {
    logger.info(
      { context: 'cloudIntegrationsAPI' },
      'Received request for cloud integration settings',
    )

    try {
      // Try to get settings from Payload CMS
      const cloudIntegrations = await getCloudIntegrations()

      // Check if we have any valid settings
      const hasDropboxKey =
        !!cloudIntegrations?.dropboxAppKey && cloudIntegrations.dropboxAppKey !== ''
      const hasGoogleClientId =
        !!cloudIntegrations?.googleClientId && cloudIntegrations.googleClientId !== ''
      const hasGoogleApiKey =
        !!cloudIntegrations?.googleApiKey && cloudIntegrations.googleApiKey !== ''

      if (!hasDropboxKey && !hasGoogleClientId && !hasGoogleApiKey) {
        logger.warn(
          { context: 'cloudIntegrationsAPI' },
          'Cloud integration settings exist but no API keys are configured',
        )

        return NextResponse.json(
          {
            dropboxAppKey: null,
            googleClientId: null,
            googleApiKey: null,
            error: 'Cloud integration settings are not configured',
            details:
              'Please go to the Admin Dashboard > Settings > Cloud Integrations and add your API keys',
          },
          { status: 200 },
        )
      }

      logger.info(
        { context: 'cloudIntegrationsAPI' },
        'Returning cloud integration settings from Payload CMS',
      )
      return NextResponse.json(cloudIntegrations)
    } catch (payloadError) {
      // If Payload CMS fails, return a helpful error message
      logger.warn(
        {
          context: 'cloudIntegrationsAPI',
          error: payloadError instanceof Error ? payloadError.message : 'Unknown error',
        },
        'Failed to get settings from Payload CMS',
      )

      return NextResponse.json(
        {
          dropboxAppKey: null,
          googleClientId: null,
          googleApiKey: null,
          error: 'Cloud integration settings are not configured',
          details:
            'Please ensure the cloud-integrations global exists in Payload CMS and add your API keys',
        },
        { status: 200 },
      )
    }
  } catch (error) {
    // This is the outer catch block for any other errors
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
        googleClientId: null,
        googleApiKey: null,
        error: `Failed to fetch cloud integration settings: ${errorMessage}`,
        details: 'Please ensure the cloud-integrations global exists in Payload CMS',
      },
      { status: 200 }, // Return 200 to prevent client from getting stuck
    )
  }
}
