/**
 * PayPal Types
 */

export interface PayPalOrderItem {
  name: string
  description?: string
  quantity: string
  unit_amount: {
    currency_code: string
    value: string
  }
}

export interface PayPalPurchaseUnit {
  reference_id?: string
  description?: string
  amount: {
    currency_code: string
    value: string
    breakdown?: {
      item_total?: {
        currency_code: string
        value: string
      }
      shipping?: {
        currency_code: string
        value: string
      }
      tax_total?: {
        currency_code: string
        value: string
      }
    }
  }
  items?: PayPalOrderItem[]
  custom_id?: string
}

export interface PayPalOrderCreateRequest {
  intent: 'CAPTURE' | 'AUTHORIZE'
  purchase_units: PayPalPurchaseUnit[]
  application_context?: {
    brand_name?: string
    locale?: string
    landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE'
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS'
    user_action?: 'CONTINUE' | 'PAY_NOW'
    return_url?: string
    cancel_url?: string
  }
}

export interface PayPalOrderResponse {
  id: string
  status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED'
  links: {
    href: string
    rel: string
    method: string
  }[]
}

export interface PayPalCaptureResponse {
  id: string
  status: 'COMPLETED' | 'DECLINED'
  purchase_units: {
    reference_id: string
    shipping: {
      name: {
        full_name: string
      }
      address: {
        address_line_1: string
        address_line_2?: string
        admin_area_2: string
        admin_area_1: string
        postal_code: string
        country_code: string
      }
    }
    payments: {
      captures: {
        id: string
        status: 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'PENDING' | 'REFUNDED'
        amount: {
          currency_code: string
          value: string
        }
        final_capture: boolean
        seller_protection: {
          status: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE'
          dispute_categories: string[]
        }
        seller_receivable_breakdown: {
          gross_amount: {
            currency_code: string
            value: string
          }
          paypal_fee: {
            currency_code: string
            value: string
          }
          net_amount: {
            currency_code: string
            value: string
          }
        }
        links: {
          href: string
          rel: string
          method: string
        }[]
        create_time: string
        update_time: string
      }[]
    }
  }[]
  payer: {
    name: {
      given_name: string
      surname: string
    }
    email_address: string
    payer_id: string
  }
  links: {
    href: string
    rel: string
    method: string
  }[]
}
