import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'
import { getUserCurrency } from '@/utilities/currency'

/**
 * POST /api/payments/stripe/create-addon-checkout
 *
 * Create a Stripe checkout session for an add-on purchase
 *
 * Request body:
 * {
 *   addonId: string,
 *   successUrl: string,
 *   cancelUrl: string,
 *   customerEmail?: string,
 *   discountCode?: string,
 *   currency?: string,
 * }
 */
export async function POST(req: Request) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    // Get request body
    const body = await req.json()
    const {
      addonId,
      successUrl,
      cancelUrl,
      customerEmail,
      discountCode,
      currency: requestCurrency,
    } = body

    // Validate required fields
    if (!addonId) {
      return NextResponse.json({ error: 'Missing required field: addonId' }, { status: 400 })
    }

    if (!successUrl) {
      return NextResponse.json({ error: 'Missing required field: successUrl' }, { status: 400 })
    }

    if (!cancelUrl) {
      return NextResponse.json({ error: 'Missing required field: cancelUrl' }, { status: 400 })
    }

    // Get payment settings
    const settings = await getPaymentSettings()

    // Check if Stripe is enabled
    if (!settings.stripe.enabled) {
      return NextResponse.json({ error: 'Stripe payments are not enabled' }, { status: 400 })
    }

    // Check if Stripe is connected
    if (!settings.stripe.connected) {
      return NextResponse.json(
        { error: 'Stripe is not connected. Please verify your credentials in the admin panel.' },
        { status: 400 },
      )
    }

    // Get the add-on
    const addon = await payload.findByID({
      collection: 'addons',
      id: addonId,
    })

    if (!addon) {
      return NextResponse.json({ error: 'Add-on not found' }, { status: 404 })
    }

    // Check if add-on is active
    if (!addon.isActive) {
      return NextResponse.json(
        { error: 'This add-on is not currently available for purchase' },
        { status: 400 },
      )
    }

    // Initialize Stripe
    // Use dynamic import for ESM compatibility
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(
      settings.stripe.testMode ? settings.stripe.apiKey : settings.stripe.liveApiKey,
    )

    // Determine which currency to use
    let userCurrency = requestCurrency || settings.currency.defaultCurrency
    
    // Find the appropriate price ID for the selected currency
    let priceId = addon.stripePriceId // Default to legacy price ID (USD)
    
    if (addon.pricesByCurrency && addon.pricesByCurrency.length > 0) {
      // Find price for the requested currency
      const priceForCurrency = addon.pricesByCurrency.find(p => p.currency === userCurrency)
      
      if (priceForCurrency && priceForCurrency.stripePriceId) {
        priceId = priceForCurrency.stripePriceId
      } else {
        // If requested currency not found, fall back to USD
        const usdPrice = addon.pricesByCurrency.find(p => p.currency === 'usd')
        if (usdPrice && usdPrice.stripePriceId) {
          priceId = usdPrice.stripePriceId
          userCurrency = 'usd'
        }
      }
    }
    
    // Check if we have a valid price ID
    if (!priceId) {
      return NextResponse.json(
        { error: 'Add-on does not have a valid price ID for the selected currency' },
        { status: 400 },
      )
    }

    // Create checkout session parameters
    const sessionParams: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: addon.type === 'recurring' ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        addonId,
        type: 'addon',
        addonType: addon.type,
        currency: userCurrency,
      },
    }

    // Add customer email if provided
    if (customerEmail) {
      sessionParams.customer_email = customerEmail
    }

    // Handle discount code if provided
    if (discountCode) {
      // Find the discount code in the database
      const discountCodeResult = await payload.find({
        collection: 'discount-codes',
        where: {
          code: {
            equals: discountCode,
          },
          isActive: {
            equals: true,
          },
        },
        limit: 1,
      })

      if (discountCodeResult.docs.length > 0) {
        const discountCodeDoc = discountCodeResult.docs[0]

        // Check if the discount code is valid for add-ons
        const isValidForAddons =
          !discountCodeDoc.limitTo ||
          discountCodeDoc.limitTo.length === 0 ||
          discountCodeDoc.limitTo.includes('addons')

        // Check if the discount code is within valid date range
        const now = new Date()
        const isWithinDateRange =
          (!discountCodeDoc.validFrom || new Date(discountCodeDoc.validFrom) <= now) &&
          (!discountCodeDoc.validUntil || new Date(discountCodeDoc.validUntil) >= now)

        // Check if the discount code has not exceeded max uses
        const hasNotExceededMaxUses =
          !discountCodeDoc.maxUses ||
          discountCodeDoc.maxUses === 0 ||
          discountCodeDoc.usageCount < discountCodeDoc.maxUses

        // Apply the discount if valid
        if (
          isValidForAddons &&
          isWithinDateRange &&
          hasNotExceededMaxUses &&
          discountCodeDoc.stripeCouponId
        ) {
          sessionParams.discounts = [
            {
              coupon: discountCodeDoc.stripeCouponId,
            },
          ]

          // Add discount code to metadata
          sessionParams.metadata.discountCode = discountCode
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams)

    // Return the session ID and publishable key
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      publishableKey: settings.stripe.publishableKey,
    })
  } catch (error) {
    logger.error(
      { error, context: 'create-addon-checkout' },
      'Error creating add-on checkout session',
    )
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
