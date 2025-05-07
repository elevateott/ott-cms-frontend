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
    const payload = await getPayload({ config: configPromise })
    
    const cloudIntegrations = await payload.findGlobal({
      slug: 'cloud-integrations',
    })
    
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
      'Found cloud integration settings'
    )
    
    return {
      dropboxAppKey: cloudIntegrations?.dropboxAppKey || null,
      googleApiKey: cloudIntegrations?.googleApiKey || null,
      googleClientId: cloudIntegrations?.googleClientId || null,
    }
  } catch (error) {
    logger.error(
      { error, context: 'getCloudIntegrations' },
      'Error getting cloud integration settings'
    )
    
    // Return default settings
    return {
      dropboxAppKey: null,
      googleApiKey: null,
      googleClientId: null,
    }
  }
}
