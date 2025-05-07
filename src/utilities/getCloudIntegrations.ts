/**
 * Utility function to get cloud integration settings from global configuration
 */

import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface CloudIntegrationSettings {
  dropboxAppKey?: string
  googleApiKey?: string
  googleClientId?: string
}

/**
 * Get cloud integration settings from global configuration
 * @returns Cloud integration settings object
 */
export async function getCloudIntegrations(): Promise<CloudIntegrationSettings> {
  try {
    // Log the request parameters
    logger.info(
      { context: 'getCloudIntegrations', params: { slug: 'cloud-integrations', draft: true } },
      'Requesting cloud-integrations global',
    )

    // Initialize Payload with the config
    const payload = await getPayload({ config: configPromise })

    logger.info({ context: 'getCloudIntegrations' }, 'Payload initialized successfully')

    const cloudIntegrations = await payload.findGlobal({
      slug: 'cloud-integrations',
      draft: true,
    })

    // Log the complete response object
    logger.info(
      {
        context: 'getCloudIntegrations',
        cloudIntegrations: JSON.stringify(cloudIntegrations),
        hasDropboxAppKey: !!cloudIntegrations?.dropboxAppKey,
        keys: cloudIntegrations ? Object.keys(cloudIntegrations) : [],
      },
      'Response from payload.findGlobal',
    )

    // Log the found settings (with sensitive data partially masked)
    const logSettings = {
      hasDropboxAppKey: !!cloudIntegrations?.dropboxAppKey,
      dropboxAppKeyType: typeof cloudIntegrations?.dropboxAppKey,
      dropboxAppKeyLength:
        typeof cloudIntegrations?.dropboxAppKey === 'string'
          ? cloudIntegrations.dropboxAppKey.length
          : 'N/A',
      hasGoogleApiKey: !!cloudIntegrations?.googleApiKey,
      googleApiKeyType: typeof cloudIntegrations?.googleApiKey,
      googleApiKeyLength:
        typeof cloudIntegrations?.googleApiKey === 'string'
          ? cloudIntegrations.googleApiKey.length
          : 'N/A',
      hasGoogleClientId: !!cloudIntegrations?.googleClientId,
      googleClientIdType: typeof cloudIntegrations?.googleClientId,
      googleClientIdLength:
        typeof cloudIntegrations?.googleClientId === 'string'
          ? cloudIntegrations.googleClientId.length
          : 'N/A',
    }

    logger.info(
      { context: 'getCloudIntegrations', settings: logSettings },
      'Found cloud integration settings',
    )

    return {
      dropboxAppKey: cloudIntegrations?.dropboxAppKey || undefined,
      googleApiKey: cloudIntegrations?.googleApiKey || undefined,
      googleClientId: cloudIntegrations?.googleClientId || undefined,
    }
  } catch (error) {
    // Log detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'

    logger.error(
      {
        error: errorMessage,
        stack: errorStack,
        errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        context: 'getCloudIntegrations',
      },
      'Error getting cloud integration settings',
    )

    // Try to check if the global exists
    try {
      logger.info(
        { context: 'getCloudIntegrations' },
        'Attempting to check if cloud-integrations global exists',
      )

      // Initialize Payload again for this check
      const payloadForCheck = await getPayload({ config: configPromise })

      // Try to get a list of all collections and globals
      // There's no direct method to list all globals in Payload v3
      // Let's try to check if we can access the cloud-integrations global
      try {
        const cloudIntegrationsGlobal = await payloadForCheck.findGlobal({
          slug: 'cloud-integrations',
        })

        logger.info(
          {
            context: 'getCloudIntegrations',
            globalExists: !!cloudIntegrationsGlobal,
            fields: cloudIntegrationsGlobal ? Object.keys(cloudIntegrationsGlobal) : [],
          },
          'cloud-integrations global check',
        )
      } catch (e) {
        logger.warn(
          {
            context: 'getCloudIntegrations',
            error: e instanceof Error ? e.message : 'Unknown error',
          },
          'Error checking cloud-integrations global',
        )
      }

      // Get information about the Payload instance
      const collections = Object.keys(payloadForCheck.collections)

      logger.info(
        {
          context: 'getCloudIntegrations',
          availableCollections: collections,
        },
        'Available collections',
      )
    } catch (listError) {
      logger.error(
        {
          error: listError instanceof Error ? listError.message : 'Unknown error',
          context: 'getCloudIntegrations',
        },
        'Error listing globals',
      )
    }

    // Return default settings
    return {
      dropboxAppKey: undefined,
      googleApiKey: undefined,
      googleClientId: undefined,
    }
  }
}
