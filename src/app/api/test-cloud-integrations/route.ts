import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * GET /api/test-cloud-integrations
 *
 * Test endpoint to check if the cloud-integrations global exists
 */
export async function GET() {
  try {
    logger.info(
      { context: 'testCloudIntegrationsAPI' },
      'Testing cloud integrations API'
    )

    const payload = await getPayload({ config: configPromise })

    // Try to find the cloud-integrations global
    try {
      const cloudIntegrations = await payload.findGlobal({
        slug: 'cloud-integrations',
      })

      logger.info(
        { context: 'testCloudIntegrationsAPI' },
        'Cloud integrations global found:',
        cloudIntegrations
      )

      return NextResponse.json({
        success: true,
        message: 'Cloud integrations global found',
        exists: true,
        data: cloudIntegrations,
      })
    } catch (error) {
      logger.warn(
        { context: 'testCloudIntegrationsAPI' },
        'Error finding cloud-integrations global:',
        error
      )

      // Try to create the global
      try {
        logger.info(
          { context: 'testCloudIntegrationsAPI' },
          'Attempting to create cloud-integrations global'
        )

        const result = await payload.updateGlobal({
          slug: 'cloud-integrations',
          data: {
            dropboxAppKey: '',
            googleClientId: '',
          },
        })

        logger.info(
          { context: 'testCloudIntegrationsAPI' },
          'Cloud integrations global created successfully:',
          result
        )

        return NextResponse.json({
          success: true,
          message: 'Cloud integrations global created successfully',
          exists: false,
          created: true,
          data: result,
        })
      } catch (createError) {
        logger.error(
          { context: 'testCloudIntegrationsAPI' },
          'Error creating cloud-integrations global:',
          createError
        )

        return NextResponse.json({
          success: false,
          message: 'Error creating cloud-integrations global',
          exists: false,
          created: false,
          error: createError instanceof Error ? createError.message : 'Unknown error',
        })
      }
    }
  } catch (error) {
    logger.error(
      { context: 'testCloudIntegrationsAPI' },
      'Error initializing Payload:',
      error
    )

    return NextResponse.json({
      success: false,
      message: 'Error initializing Payload',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
