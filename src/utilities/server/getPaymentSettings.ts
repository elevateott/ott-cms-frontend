'use server'

import { getPayload } from '@/payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

/**
 * Server-only utility to get payment settings from Payload CMS
 * This should only be used in server components or API routes
 */
export async function getPaymentSettingsServer() {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = await payload.findGlobal({
      slug: 'payment-settings' as any,
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
      currency: {
        defaultCurrency: settings?.currency?.defaultCurrency || 'usd',
        supportedCurrencies: settings?.currency?.supportedCurrencies || ['usd'],
        detectUserCurrency: settings?.currency?.detectUserCurrency ?? true,
      },
    }
  } catch (error) {
    logger.error({ error, context: 'getPaymentSettings' }, 'Error getting payment settings')
    
    // Return default settings on error
    return {
      stripe: {
        enabled: false,
        testMode: true,
        accountId: '',
        connected: false,
        apiKey: '',
        liveApiKey: '',
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
      currency: {
        defaultCurrency: 'usd',
        supportedCurrencies: ['usd'],
        detectUserCurrency: true,
      },
    }
  }
}
