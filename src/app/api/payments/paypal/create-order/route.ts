import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPayPalAccessToken, getPayPalBaseURL } from '@/utilities/paypal'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'
import type { PayPalOrderCreateRequest, PayPalOrderResponse } from '@/types/paypal'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get payment settings
    const settings = await getPaymentSettings()

    // Check if PayPal is enabled
    if (!settings.paypal.enabled) {
      return NextResponse.json({ error: 'PayPal payments are not enabled' }, { status: 400 })
    }

    // Check if PayPal is connected
    if (!settings.paypal.connected) {
      return NextResponse.json(
        { error: 'PayPal is not connected. Please verify your credentials in the admin panel.' },
        { status: 400 },
      )
    }

    // Get request body
    const body = await req.json()
    const {
      amount,
      currency = 'USD',
      description = 'OTT Platform Purchase',
      items = [],
      customId,
      applicationContext,
    } = body

    // Validate required fields
    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    // Determine environment based on test mode
    const environment = settings.paypal.testMode ? 'sandbox' : 'live'

    // Log the environment being used
    logger.info(
      {
        testMode: settings.paypal.testMode,
        environment,
      },
      'Creating PayPal order',
    )

    // Get access token
    const accessToken = await getPayPalAccessToken(
      settings.paypal.clientId,
      settings.paypal.clientSecret,
      environment,
    )

    // Create order request
    const orderRequest: PayPalOrderCreateRequest = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `order-${Date.now()}`,
          description,
          custom_id: customId,
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
        },
      ],
      application_context: applicationContext || {
        brand_name: 'OTT Platform',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    }

    // Add items if provided
    if (items.length > 0) {
      orderRequest.purchase_units[0].items = items

      // Calculate item total
      const itemTotal = items.reduce((total, item) => {
        return total + parseFloat(item.unit_amount.value) * parseInt(item.quantity)
      }, 0)

      // Add breakdown
      orderRequest.purchase_units[0].amount.breakdown = {
        item_total: {
          currency_code: currency,
          value: itemTotal.toFixed(2),
        },
      }
    }

    // Get base URL
    const baseURL = getPayPalBaseURL(environment)

    // Create order
    const response = await fetch(`${baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderRequest),
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error({ data }, 'PayPal order creation failed')
      return NextResponse.json(
        { error: data.message || 'Failed to create PayPal order' },
        { status: response.status },
      )
    }

    // Log the order creation
    logger.info({ orderId: data.id }, 'PayPal order created')

    return NextResponse.json(data as PayPalOrderResponse)
  } catch (error) {
    logger.error(error, 'Error creating PayPal order')
    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 })
  }
}
