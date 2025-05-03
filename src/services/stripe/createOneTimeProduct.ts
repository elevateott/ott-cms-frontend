/**
 * Service to create a Stripe product and price for a one-time purchase (PPV, rentals, digital products)
 */
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

interface PriceByCurrency {
  currency: string
  amount: number
  stripePriceId?: string
}

interface CreateStripeOneTimeProductParams {
  name: string
  description?: string
  price?: number // Legacy price in USD cents
  pricesByCurrency?: PriceByCurrency[] // New multi-currency prices
  metadata?: Record<string, string> // Additional metadata for the product
}

interface StripeOneTimeProductResult {
  productId: string
  priceId: string // Legacy USD price ID
  pricesByCurrency?: PriceByCurrency[] // Updated with Stripe price IDs
}

/**
 * Create a Stripe product and price for a one-time purchase
 */
export const createStripeOneTimeProduct = async (
  params: CreateStripeOneTimeProductParams,
): Promise<StripeOneTimeProductResult> => {
  try {
    const { name, description, price, pricesByCurrency, metadata = {} } = params

    // Get Stripe settings
    const settings = await getPaymentSettings()
    const { stripe: stripeSettings } = settings

    // Check if Stripe is enabled
    if (!stripeSettings.enabled) {
      throw new Error('Stripe payments are not enabled')
    }

    // Initialize Stripe
    // Use dynamic import for ESM compatibility
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(
      stripeSettings.testMode ? stripeSettings.apiKey : stripeSettings.liveApiKey,
    )

    // Create a product
    const product = await stripe.products.create({
      name,
      description,
      metadata: {
        source: 'ott-cms',
        type: metadata.type || 'one-time',
        ...metadata,
      },
    })

    // Determine which currencies to create prices for
    let pricesToCreate: PriceByCurrency[] = []

    // If we have pricesByCurrency, use those
    if (pricesByCurrency && pricesByCurrency.length > 0) {
      pricesToCreate = [...pricesByCurrency]
    }
    // Otherwise, use the legacy price field (USD only)
    else if (price !== undefined) {
      pricesToCreate = [{ currency: 'usd', amount: price }]
    }
    // If neither is provided, throw an error
    else {
      throw new Error('Either price or pricesByCurrency must be provided')
    }

    // Get supported currencies from settings
    const supportedCurrencies = settings.currency.supportedCurrencies || ['usd']

    // Filter out unsupported currencies
    pricesToCreate = pricesToCreate.filter((p) => supportedCurrencies.includes(p.currency))

    // Ensure we have at least one price
    if (pricesToCreate.length === 0) {
      throw new Error('No valid prices provided')
    }

    // Create prices for each currency
    const updatedPrices: PriceByCurrency[] = []
    let usdPriceId: string | undefined

    for (const priceData of pricesToCreate) {
      // Create a one-time price
      const priceObj = await stripe.prices.create({
        product: product.id,
        unit_amount: priceData.amount,
        currency: priceData.currency,
        metadata: {
          source: 'ott-cms',
          currency: priceData.currency,
          type: metadata.type || 'one-time',
          ...metadata,
        },
      })

      // Store the price ID
      updatedPrices.push({
        currency: priceData.currency,
        amount: priceData.amount,
        stripePriceId: priceObj.id,
      })

      // Store the USD price ID for backward compatibility
      if (priceData.currency === 'usd') {
        usdPriceId = priceObj.id
      }
    }

    return {
      productId: product.id,
      priceId: usdPriceId || updatedPrices[0]?.stripePriceId || '', // For backward compatibility
      pricesByCurrency: updatedPrices,
    }
  } catch (error) {
    logger.error(
      { error, context: 'createStripeOneTimeProduct' },
      'Error creating Stripe one-time product',
    )
    throw error
  }
}
