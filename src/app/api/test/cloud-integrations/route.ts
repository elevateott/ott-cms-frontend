import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function GET() {
  try {
    logger.info(
      { context: 'testCloudIntegrationsAPI' },
      'Testing cloud integrations API'
    )

    const payload = await getPayload({ config: configPromise })

    // Get all globals to check if cloud-integrations exists
    const globals = await payload.globals.find()
    
    logger.info(
      { context: 'testCloudIntegrationsAPI' },
      'Available globals:',
      Object.keys(globals)
    )

    // Try to find the cloud-integrations global
    try {
      const cloudIntegrations = await payload.findGlobal({
        slug: 'cloud-integrations',
      })

      logger.info(
        { context: 'testCloudIntegrationsAPI' },
        'Cloud integrations global found:',
        cloudIntegrations ? 'yes' : 'no'
      )

      return NextResponse.json({
        success: true,
        message: 'Cloud integrations global found',
        exists: true,
        data: cloudIntegrations,
        allGlobals: Object.keys(globals),
      })
    } catch (error) {
      logger.warn(
        { context: 'testCloudIntegrationsAPI' },
        'Error finding cloud-integrations global:',
        error
      )

      return NextResponse.json({
        success: false,
        message: 'Cloud integrations global not found',
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        allGlobals: Object.keys(globals),
      })
    }
  } catch (error) {
    logger.error(
      { context: 'testCloudIntegrationsAPI' },
      'Error testing cloud integrations API:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message: 'Error testing cloud integrations API',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
