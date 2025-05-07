import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { getCloudIntegrations } from '@/utilities/getCloudIntegrations'

/**
 * GET /api/cloud-integrations/dropbox-key
 *
 * Returns just the Dropbox app key for faster loading
 */
export async function GET() {
  try {
    logger.info({ context: 'dropboxKeyAPI' }, 'Received request for Dropbox app key')

    // Use the utility function to get cloud integration settings
    const cloudIntegrations = await getCloudIntegrations()

    logger.info(
      { context: 'dropboxKeyAPI', hasKey: !!cloudIntegrations.dropboxAppKey },
      'Found Dropbox app key',
    )

    // Return just the Dropbox app key
    return NextResponse.json({
      dropboxAppKey: cloudIntegrations.dropboxAppKey || '',
    })
  } catch (error) {
    logger.error({ context: 'dropboxKeyAPI', error }, 'Error fetching Dropbox app key')

    return NextResponse.json(
      {
        dropboxAppKey: null,
        error: 'Failed to fetch Dropbox app key',
      },
      { status: 200 }, // Return 200 to prevent client from getting stuck
    )
  }
}
