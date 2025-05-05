import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * POST /api/init-cloud-integrations
 *
 * Initialize the cloud-integrations global if it doesn't exist
 */
export async function POST() {
  try {
    logger.info({ context: 'initCloudIntegrationsAPI' }, 'Initializing cloud-integrations global')

    const payload = await getPayload({ config: configPromise })

    // Check if the global exists
    try {
      const existingGlobal = await payload.findGlobal({
        slug: 'cloud-integrations',
      })

      logger.info(
        { context: 'initCloudIntegrationsAPI' },
        'Cloud integrations global already exists',
        existingGlobal,
      )

      return NextResponse.json({
        success: true,
        message: 'Cloud integrations global already exists',
        data: existingGlobal,
      })
    } catch (error) {
      // Global doesn't exist, create it
      logger.info(
        { context: 'initCloudIntegrationsAPI' },
        'Cloud integrations global does not exist, creating it',
      )

      // Create the global with default values
      const result = await payload.updateGlobal({
        slug: 'cloud-integrations',
        data: {
          dropboxAppKey: null,
          googleApiKey: null,
          googleClientId: null,
        },
      })

      logger.info(
        { context: 'initCloudIntegrationsAPI' },
        'Cloud integrations global created successfully',
        result,
      )

      return NextResponse.json({
        success: true,
        message: 'Cloud integrations global created successfully',
        data: result,
      })
    }
  } catch (error) {
    logger.error(
      { context: 'initCloudIntegrationsAPI', error },
      'Error initializing cloud integrations global',
    )

    return NextResponse.json(
      {
        success: false,
        message: 'Error initializing cloud integrations global',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
