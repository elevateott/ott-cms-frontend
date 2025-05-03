import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

export async function GET(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    // Get payment settings
    const settings = await getPaymentSettings()

    // Check if PayPal is enabled
    if (!settings.paypal.enabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'PayPal payments are not enabled',
        },
        { status: 400 },
      )
    }

    // Check if PayPal is connected
    if (!settings.paypal.connected) {
      return NextResponse.json(
        {
          success: false,
          error: 'PayPal is not connected. Please verify your credentials in the admin panel.',
        },
        { status: 400 },
      )
    }

    // Check if client ID is configured
    if (!settings.paypal.clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'PayPal Client ID is not configured',
        },
        { status: 400 },
      )
    }

    // Determine environment based on test mode
    const environment = settings.paypal.testMode ? 'sandbox' : 'live'

    // Log the environment being used
    logger.info(
      {
        testMode: settings.paypal.testMode,
        environment,
      },
      'Getting PayPal client ID',
    )

    return NextResponse.json({
      success: true,
      clientId: settings.paypal.clientId,
      environment: environment,
      testMode: settings.paypal.testMode,
    })
  } catch (error) {
    logger.error(error, 'Error getting PayPal client ID')
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get PayPal client ID',
      },
      { status: 500 },
    )
  }
}
