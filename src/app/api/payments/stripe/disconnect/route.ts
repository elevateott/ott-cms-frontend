import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function POST(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const { accountId, testMode } = await req.json()
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      )
    }
    
    // Get Stripe API key based on mode
    const stripeSecretKey = testMode 
      ? process.env.STRIPE_TEST_SECRET_KEY 
      : process.env.STRIPE_LIVE_SECRET_KEY
    
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: `Stripe ${testMode ? 'test' : 'live'} secret key not configured` },
        { status: 500 }
      )
    }
    
    // Initialize Stripe
    const stripe = require('stripe')(stripeSecretKey)
    
    // Deauthorize the account
    await stripe.oauth.deauthorize({
      client_id: testMode 
        ? process.env.STRIPE_TEST_CLIENT_ID 
        : process.env.STRIPE_LIVE_CLIENT_ID,
      stripe_user_id: accountId,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(error, 'Error disconnecting Stripe account')
    return NextResponse.json(
      { error: 'Failed to disconnect Stripe account' },
      { status: 500 }
    )
  }
}
