import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function POST(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const { testMode, redirectUri } = await req.json()
    
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
    
    // Generate OAuth URL
    const state = Math.random().toString(36).substring(2, 15)
    
    const url = stripe.oauth.authorizeUrl({
      client_id: testMode 
        ? process.env.STRIPE_TEST_CLIENT_ID 
        : process.env.STRIPE_LIVE_CLIENT_ID,
      redirect_uri: redirectUri,
      state,
      suggested_capabilities: ['card_payments', 'transfers'],
      stripe_user: {
        business_type: 'company',
        product_description: 'OTT Platform Services',
      },
    })
    
    return NextResponse.json({ url })
  } catch (error) {
    logger.error(error, 'Error generating Stripe OAuth URL')
    return NextResponse.json(
      { error: 'Failed to generate Stripe OAuth URL' },
      { status: 500 }
    )
  }
}
