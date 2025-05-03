/**
 * Utility function to get payment settings from global configuration
 */

import { logger } from '@/utils/logger'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface StripeSettings {
  enabled: boolean
  testMode: boolean
  accountId: string
  connected: boolean
  apiKey?: string
  liveApiKey?: string
  publishableKey?: string
}

export interface PayPalSettings {
  enabled: boolean
  testMode: boolean
  environment: 'sandbox' | 'live'
  clientId: string
  clientSecret: string
  connected: boolean
}

export interface PaymentSettings {
  stripe: StripeSettings
  paypal: PayPalSettings
  activePaymentMethods: string[]
}

export const getPaymentSettings = async (): Promise<PaymentSettings> => {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = await payload.findGlobal({
      slug: 'payment-settings',
    })

    return {
      stripe: {
        enabled: settings?.stripe?.enabled || false,
        testMode: settings?.stripe?.testMode || true,
        accountId: settings?.stripe?.accountId || '',
        connected: settings?.stripe?.connected || false,
        apiKey: settings?.stripe?.apiKey,
        liveApiKey: settings?.stripe?.liveApiKey,
        publishableKey: settings?.stripe?.publishableKey || '',
      },
      paypal: {
        enabled: settings?.paypal?.enabled || false,
        testMode: settings?.paypal?.testMode || true,
        environment: settings?.paypal?.environment || 'sandbox',
        clientId: settings?.paypal?.clientId || '',
        clientSecret: settings?.paypal?.clientSecret || '',
        connected: settings?.paypal?.connected || false,
      },
      activePaymentMethods: settings?.activePaymentMethods || [],
    }
  } catch (error) {
    logger.error(error, 'Failed to get payment settings')

    // Return default settings
    return {
      stripe: {
        enabled: false,
        testMode: true,
        accountId: '',
        connected: false,
        publishableKey: '',
      },
      paypal: {
        enabled: false,
        testMode: true,
        environment: 'sandbox',
        clientId: '',
        clientSecret: '',
        connected: false,
      },
      activePaymentMethods: [],
    }
  }
}

/**
 * Get the appropriate Stripe API key based on test mode
 */
export const getStripeApiKey = (settings: StripeSettings): string | undefined => {
  if (settings.testMode) {
    return settings.apiKey
  } else {
    return settings.liveApiKey
  }
}
