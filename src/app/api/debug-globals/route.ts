import { NextResponse } from 'next/server'
import { logger } from '@/utils/logger'
import { getInitializedPayload } from '@/utilities/getInitializedPayload'

/**
 * GET /api/debug-globals
 *
 * Debug endpoint to check if globals exist in the database
 */
export async function GET() {
  try {
    logger.info({ context: 'debugGlobalsAPI' }, 'Received request for debug globals')

    // Get initialized Payload instance
    const payload = await getInitializedPayload()

    // Get a list of all globals
    const globals = await payload.db.globals.find({})

    // Check if cloud-integrations global exists
    const cloudIntegrationsExists = globals.some(
      (global: any) => global.slug === 'cloud-integrations',
    )

    // Try to get cloud-integrations global
    let cloudIntegrations = null
    if (cloudIntegrationsExists) {
      try {
        cloudIntegrations = await payload.findGlobal({
          slug: 'cloud-integrations',
          draft: true,
        })
      } catch (error) {
        logger.error(
          {
            context: 'debugGlobalsAPI',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          'Failed to get cloud-integrations global',
        )
      }
    }

    return NextResponse.json({
      globals: globals.map((global: any) => ({
        slug: global.slug,
        id: global.id,
      })),
      cloudIntegrationsExists,
      cloudIntegrations: cloudIntegrations
        ? {
            hasDropboxAppKey: !!cloudIntegrations.dropboxAppKey,
            hasGoogleClientId: !!cloudIntegrations.googleClientId,
          }
        : null,
    })
  } catch (error) {
    logger.error(
      {
        context: 'debugGlobalsAPI',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Error in debug globals API',
    )

    return NextResponse.json(
      {
        error: 'Error in debug globals API',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
