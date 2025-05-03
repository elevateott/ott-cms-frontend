import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export async function GET(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    
    if (error) {
      logger.error({ error }, 'Stripe OAuth error')
      return new Response(
        `
        <html>
          <head>
            <title>Stripe Connection Failed</title>
            <script>
              window.opener.postMessage({ type: 'stripe-error', error: '${error}' }, window.location.origin);
              window.close();
            </script>
          </head>
          <body>
            <p>Connection failed. You can close this window.</p>
          </body>
        </html>
        `,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }
    
    if (!code) {
      return new Response(
        `
        <html>
          <head>
            <title>Stripe Connection Failed</title>
            <script>
              window.opener.postMessage({ type: 'stripe-error', error: 'No authorization code received' }, window.location.origin);
              window.close();
            </script>
          </head>
          <body>
            <p>Connection failed. You can close this window.</p>
          </body>
        </html>
        `,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }
    
    // Get payment settings to determine mode
    const paymentSettings = await payload.findGlobal({
      slug: 'payment-settings',
    })
    
    const testMode = paymentSettings?.stripe?.testMode ?? true
    
    // Get Stripe API key based on mode
    const stripeSecretKey = testMode 
      ? process.env.STRIPE_TEST_SECRET_KEY 
      : process.env.STRIPE_LIVE_SECRET_KEY
    
    if (!stripeSecretKey) {
      return new Response(
        `
        <html>
          <head>
            <title>Stripe Connection Failed</title>
            <script>
              window.opener.postMessage({ type: 'stripe-error', error: 'Stripe API key not configured' }, window.location.origin);
              window.close();
            </script>
          </head>
          <body>
            <p>Connection failed. You can close this window.</p>
          </body>
        </html>
        `,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }
    
    // Initialize Stripe
    const stripe = require('stripe')(stripeSecretKey)
    
    // Exchange code for access token
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    })
    
    // Get the connected account ID
    const accountId = response.stripe_user_id
    
    // Return success page that posts message to parent window
    return new Response(
      `
      <html>
        <head>
          <title>Stripe Connected Successfully</title>
          <script>
            window.opener.postMessage({ type: 'stripe-connected', accountId: '${accountId}' }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <p>Connection successful! You can close this window.</p>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  } catch (error) {
    logger.error(error, 'Error processing Stripe OAuth callback')
    return new Response(
      `
      <html>
        <head>
          <title>Stripe Connection Failed</title>
          <script>
            window.opener.postMessage({ type: 'stripe-error', error: 'Internal server error' }, window.location.origin);
            window.close();
          </script>
        </head>
        <body>
          <p>Connection failed. You can close this window.</p>
        </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  }
}
