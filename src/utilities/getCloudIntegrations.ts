/**
 * Utility function to get cloud integration settings from global configuration
 */

import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface CloudIntegrationSettings {
  dropboxAppKey?: string
  googleClientId?: string
}

/**
 * Get cloud integration settings from global configuration
 * @returns Cloud integration settings object
 */
export async function getCloudIntegrations(): Promise<CloudIntegrationSettings> {
  try {
    logger.info({ context: 'getCloudIntegrations' }, 'Fetching cloud-integrations global')

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    const global = await payload.findGlobal({
      slug: 'cloud-integrations',
    })

    logger.info(
      {
        context: 'getCloudIntegrations',
        hasDropboxAppKey: !!global?.dropboxAppKey,
        hasGoogleClientId: !!global?.googleClientId,
      },
      'Cloud integration settings retrieved successfully',
    )

    return {
      dropboxAppKey: global.dropboxAppKey || undefined,
      googleClientId: global.googleClientId || undefined,
    }
  } catch (err) {
    logger.error(
      {
        context: 'getCloudIntegrations',
        error: err instanceof Error ? err.message : err,
        stack: err instanceof Error ? err.stack : undefined,
      },
      'Failed to fetch cloud integration settings',
    )

    return {
      dropboxAppKey: undefined,
      googleClientId: undefined,
    }
  }
}
