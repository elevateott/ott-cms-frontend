import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function GET() {
  logger.info({ context: 'cloudIntegrationsAPI' }, 'Cloud integrations API endpoint called')

  try {
    logger.info({ context: 'cloudIntegrationsAPI' }, 'Getting Payload instance')
    const payload = await getPayload({ config: configPromise })

    logger.info({ context: 'cloudIntegrationsAPI' }, 'Fetching cloud integrations settings')

    // Check if the global exists first
    const globals = await payload.globals.find()
    logger.info({ context: 'cloudIntegrationsAPI' }, 'Available globals:', globals)

    // Try to find the cloud-integrations global
    let cloudIntegrations
    try {
      cloudIntegrations = await payload.findGlobal({
        slug: 'cloud-integrations',
      })
      logger.info(
        { context: 'cloudIntegrationsAPI' },
        'Cloud integrations settings found:',
        cloudIntegrations,
      )
    } catch (findError) {
      logger.error(
        { context: 'cloudIntegrationsAPI' },
        'Error finding cloud-integrations global:',
        findError,
      )

      // Return default settings if the global doesn't exist yet
      return NextResponse.json({
        dropboxAppKey: null,
        googleApiKey: null,
        googleClientId: null,
        onedriveClientId: null,
        message: 'Cloud integrations settings not found - using defaults',
      })
    }

    // Only return the necessary fields for client-side use
    const clientSettings = {
      dropboxAppKey: cloudIntegrations?.dropboxAppKey || null,
      googleApiKey: cloudIntegrations?.googleApiKey || null,
      googleClientId: cloudIntegrations?.googleClientId || null,
      onedriveClientId: cloudIntegrations?.onedriveClientId || null,
    }

    logger.info({ context: 'cloudIntegrationsAPI' }, 'Returning client settings:', clientSettings)
    return NextResponse.json(clientSettings)
  } catch (error) {
    logger.error(
      { context: 'cloudIntegrationsAPI' },
      'Error fetching cloud integration settings:',
      error,
    )

    // Return default settings in case of error
    return NextResponse.json(
      {
        dropboxAppKey: null,
        googleApiKey: null,
        googleClientId: null,
        onedriveClientId: null,
        error: 'Error fetching cloud integration settings',
      },
      { status: 200 }, // Return 200 instead of 500 to prevent the client from getting stuck
    )
  }
}
