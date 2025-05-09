import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const { clientId, clientSecret, environment } = await req.json()

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID and Client Secret are required' },
        { status: 400 },
      )
    }

    // Determine the base URL based on environment
    const baseURL =
      environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'

    // Get OAuth token to verify credentials
    const tokenResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || !tokenData.access_token) {
      logger.error({ tokenData }, 'PayPal authentication failed')
      return NextResponse.json(
        { success: false, error: 'Invalid PayPal credentials' },
        { status: 400 },
      )
    }

    // If we got here, credentials are valid
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(error, 'Error verifying PayPal credentials')
    return NextResponse.json(
      { success: false, error: 'Failed to verify PayPal credentials' },
      { status: 500 },
    )
  }
}
