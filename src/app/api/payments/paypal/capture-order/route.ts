import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPayPalAccessToken, getPayPalBaseURL } from '@/utilities/paypal'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'
import type { PayPalCaptureResponse } from '@/types/paypal'

export async function POST(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    
    // Get payment settings
    const settings = await getPaymentSettings()
    
    // Check if PayPal is enabled
    if (!settings.paypal.enabled) {
      return NextResponse.json(
        { error: 'PayPal payments are not enabled' },
        { status: 400 }
      )
    }
    
    // Check if PayPal is connected
    if (!settings.paypal.connected) {
      return NextResponse.json(
        { error: 'PayPal is not connected. Please verify your credentials in the admin panel.' },
        { status: 400 }
      )
    }
    
    // Get request body
    const body = await req.json()
    const { orderId } = body
    
    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    // Get access token
    const accessToken = await getPayPalAccessToken(
      settings.paypal.clientId,
      settings.paypal.clientSecret,
      settings.paypal.environment
    )
    
    // Get base URL
    const baseURL = getPayPalBaseURL(settings.paypal.environment)
    
    // Capture order
    const response = await fetch(`${baseURL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      logger.error({ data }, 'PayPal order capture failed')
      return NextResponse.json(
        { error: data.message || 'Failed to capture PayPal order' },
        { status: response.status }
      )
    }
    
    // Log the order capture
    logger.info({ 
      orderId: data.id, 
      status: data.status,
      captureId: data.purchase_units?.[0]?.payments?.captures?.[0]?.id
    }, 'PayPal order captured')
    
    // Store the payment information in the database if needed
    // This could be implemented based on your application's requirements
    
    return NextResponse.json(data as PayPalCaptureResponse)
  } catch (error) {
    logger.error(error, 'Error capturing PayPal order')
    return NextResponse.json(
      { error: 'Failed to capture PayPal order' },
      { status: 500 }
    )
  }
}
