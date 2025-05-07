import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { getCloudIntegrations } from '@/utilities/getCloudIntegrations'

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
