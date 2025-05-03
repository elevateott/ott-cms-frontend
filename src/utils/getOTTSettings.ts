/**
 * Utility function to get OTT settings from global configuration
 */

import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface OTTSettings {
  general?: {
    siteName?: string
    siteDescription?: string
    logo?: string
    favicon?: string
  }
  features?: {
    enableMembershipFeatures?: boolean
    enableDownloads?: boolean
    enableComments?: boolean
    enableRatings?: boolean
    enableDeviceLimiting?: boolean
    defaultMaxDevices?: number
  }
  player?: {
    autoplay?: boolean
    enableAutoNext?: boolean
    defaultPlayerQuality?: string
  }
  monetization?: {
    plans?: Array<{
      name: string
      price: number
      interval: string
      features: Array<{ feature: string }>
    }>
  }
  analytics?: {
    googleAnalyticsId?: string
    enableMuxAnalytics?: boolean
  }
}

/**
 * Get OTT settings from global configuration
 * @returns OTT settings object
 */
export async function getOTTSettings(): Promise<OTTSettings> {
  try {
    const payload = await getPayload({ config: configPromise })
    
    const settings = await payload.findGlobal({
      slug: 'ott-settings',
    })
    
    return settings
  } catch (error) {
    logger.error(
      { error, context: 'getOTTSettings' },
      'Error getting OTT settings'
    )
    
    // Return default settings
    return {
      general: {
        siteName: 'OTT Platform',
      },
      features: {
        enableMembershipFeatures: false,
        enableDownloads: false,
        enableComments: true,
        enableRatings: true,
        enableDeviceLimiting: false,
        defaultMaxDevices: 2,
      },
      player: {
        autoplay: false,
        enableAutoNext: true,
        defaultPlayerQuality: 'auto',
      },
    }
  }
}
