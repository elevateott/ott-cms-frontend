declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      MUX_TOKEN_ID: string
      MUX_TOKEN_SECRET: string
      MUX_WEBHOOK_SECRET: string
      MUX_DRM_CONFIGURATION_ID: string
      CRON_SECRET: string
      RESEND_API_KEY: string
      RESEND_FROM_ADDRESS: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
