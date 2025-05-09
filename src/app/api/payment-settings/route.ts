import { NextResponse } from 'next/server'
import { getPaymentSettingsServer } from '@/utilities/server/getPaymentSettings'
import { logger } from '@/utils/logger'

/**
 * API route to get payment settings
 * This provides a client-safe way to access payment settings
 */
export async function GET() {
  try {
    const settings = await getPaymentSettingsServer()
    
    // Return only the public parts of the settings
    // Don't expose sensitive API keys to the client
    return NextResponse.json({
      stripe: {
        enabled: settings.stripe.enabled,
        testMode: settings.stripe.testMode,
        connected: settings.stripe.connected,
        publishableKey: settings.stripe.publishableKey,
      },
      paypal: {
        enabled: settings.paypal.enabled,
        testMode: settings.paypal.testMode,
        environment: settings.paypal.environment,
        clientId: settings.paypal.clientId,
        connected: settings.paypal.connected,
      },
      activePaymentMethods: settings.activePaymentMethods,
      currency: settings.currency,
    })
  } catch (error) {
    logger.error({ error, context: 'payment-settings-api' }, 'Error getting payment settings')
    
    return NextResponse.json(
      { error: 'Failed to get payment settings' },
      { status: 500 }
    )
  }
}
