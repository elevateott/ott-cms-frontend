export const API_ROUTES = {
  VIDEOS: '/api/videos',
  MUX_DIRECT_UPLOAD: '/api/mux/direct-upload',
  MUX_CREATE_VIDEO: '/api/mux/create-video',
  EVENTS: '/api/events',
  LIVE_EVENTS: '/api/live-events',
  CONTENT: '/api/content',
  ACCESS_CHECK: '/api/access-check',
  PAYMENTS: {
    TEST: '/api/payments/test',
    STRIPE: {
      CREATE_CHECKOUT: '/api/payments/stripe/create-checkout',
      CREATE_PPV_CHECKOUT: '/api/payments/stripe/create-ppv-checkout',
      CREATE_RENTAL_CHECKOUT: '/api/payments/stripe/create-rental-checkout',
      CREATE_PRODUCT_CHECKOUT: '/api/payments/stripe/create-product-checkout',
      CUSTOMER_PORTAL: '/api/payments/stripe/customer-portal',
    },
    PAYPAL: {
      CLIENT_ID: '/api/payments/paypal/client-id',
      CREATE_ORDER: '/api/payments/paypal/create-order',
      CAPTURE_ORDER: '/api/payments/paypal/capture-order',
      VERIFY: '/api/payments/paypal/verify',
    },
  },
  PRODUCTS: {
    CHECK_ACCESS: '/api/products/check-access',
  },
} as const
