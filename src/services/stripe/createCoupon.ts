/**
 * Service to create a Stripe coupon for discount codes
 */
import { logger } from '@/utils/logger'
import { getPaymentSettings } from '@/utilities/getPaymentSettings'

interface CreateStripeCouponParams {
  code: string
  type: 'percent_off' | 'amount_off'
  value: number
  validFrom?: string
  validUntil?: string
  maxUses?: number
}

interface StripeCouponResult {
  couponId: string
}

/**
 * Create a Stripe coupon for a discount code
 */
export const createStripeCoupon = async (
  params: CreateStripeCouponParams,
): Promise<StripeCouponResult> => {
  try {
    const { code, type, value, validFrom, validUntil, maxUses } = params

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

    // Create coupon parameters
    const couponParams: any = {
      name: code,
      duration: 'once', // One-time use per customer
      metadata: {
        source: 'ott-cms',
        type: 'discount-code',
      },
    }

    // Add discount type and value
    if (type === 'percent_off') {
      couponParams.percent_off = value
    } else {
      couponParams.amount_off = value
      couponParams.currency = 'usd'
    }

    // Add redemption limit if specified
    if (maxUses && maxUses > 0) {
      couponParams.max_redemptions = maxUses
    }

    // Add expiration if specified
    if (validUntil) {
      const expirationDate = new Date(validUntil)
      couponParams.redeem_by = Math.floor(expirationDate.getTime() / 1000) // Convert to Unix timestamp
    }

    // Create the coupon in Stripe
    const coupon = await stripe.coupons.create(couponParams)

    return {
      couponId: coupon.id,
    }
  } catch (error) {
    logger.error({ error, context: 'createStripeCoupon' }, 'Error creating Stripe coupon')
    throw error
  }
}
