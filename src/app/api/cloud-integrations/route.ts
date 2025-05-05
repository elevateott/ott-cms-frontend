import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    // First check if the cloud-integrations global exists
    const cloudIntegrations = await payload
      .findGlobal({
        slug: 'cloud-integrations',
      })
      .catch(() => null)

    // Return default settings if the global doesn't exist
    if (!cloudIntegrations) {
      logger.info(
        { context: 'cloudIntegrationsAPI' },
        'Cloud integrations global not found, returning defaults',
      )
      return NextResponse.json({
        dropboxAppKey: null,
        googleApiKey: null,
        googleClientId: null,
        message: 'Cloud integrations settings not found - using defaults',
      })
    }

    // Return the settings
    const clientSettings = {
      dropboxAppKey: cloudIntegrations.dropboxAppKey || null,
      googleApiKey: cloudIntegrations.googleApiKey || null,
      googleClientId: cloudIntegrations.googleClientId || null,
    }

    logger.info({ context: 'cloudIntegrationsAPI' }, 'Returning cloud integration settings')
    return NextResponse.json(clientSettings)
  } catch (error) {
    logger.error(
      { context: 'cloudIntegrationsAPI', error },
      'Error fetching cloud integration settings',
    )

    return NextResponse.json(
      {
        dropboxAppKey: null,
        googleApiKey: null,
        googleClientId: null,
        error: 'Failed to fetch cloud integration settings',
      },
      { status: 200 }, // Return 200 to prevent client from getting stuck
    )
  }
}
