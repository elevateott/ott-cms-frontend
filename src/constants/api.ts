export const API_ROUTES = {
  VIDEOS: '/api/videos',
  MUX_DIRECT_UPLOAD: '/api/mux/direct-upload',
  MUX_CREATE_VIDEO: '/api/mux/create-video',
  EVENTS: '/api/events',
  PAYMENTS: {
    TEST: '/api/payments/test',
    PAYPAL: {
      CLIENT_ID: '/api/payments/paypal/client-id',
      CREATE_ORDER: '/api/payments/paypal/create-order',
      CAPTURE_ORDER: '/api/payments/paypal/capture-order',
      VERIFY: '/api/payments/paypal/verify',
    },
  },
} as const
