import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPaymentSettings, getStripeApiKey } from '@/utilities/getPaymentSettings'

export async function GET(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    
    // Get payment settings
    const settings = await getPaymentSettings()
    
    // Create a sanitized version of the settings (without sensitive data)
    const sanitizedSettings = {
      stripe: {
        enabled: settings.stripe.enabled,
        testMode: settings.stripe.testMode,
        connected: settings.stripe.connected,
        accountId: settings.stripe.accountId,
        hasApiKey: !!getStripeApiKey(settings.stripe),
        hasPublishableKey: !!settings.stripe.publishableKey,
      },
      paypal: {
        enabled: settings.paypal.enabled,
        testMode: settings.paypal.testMode,
        environment: settings.paypal.environment,
        connected: settings.paypal.connected,
        hasClientId: !!settings.paypal.clientId,
        hasClientSecret: !!settings.paypal.clientSecret,
      },
      activePaymentMethods: settings.activePaymentMethods,
    }
    
    return NextResponse.json({ 
      success: true,
      settings: sanitizedSettings,
    })
  } catch (error) {
    logger.error(error, 'Error testing payment settings')
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test payment settings' 
      },
      { status: 500 }
    )
  }
}
