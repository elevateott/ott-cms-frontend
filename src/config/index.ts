/**
 * Centralized configuration module
 *
 * This module provides a type-safe way to access configuration values
 * from environment variables and other sources.
 */

// Define the configuration schema
export interface Config {
  mux: {
    tokenId: string
    tokenSecret: string
    webhookSecret: string
    signingKeyId: string
    signingKeyPrivateKey: string
  }
  app: {
    baseUrl: string
    environment: 'development' | 'production' | 'test'
  }
}

// Load and validate configuration
function loadConfig(): Config {
  // Validate required environment variables
  const requiredEnvVars = [
    'MUX_TOKEN_ID',
    'MUX_TOKEN_SECRET',
    'MUX_WEBHOOK_SECRET',
    'MUX_SIGNING_KEY_ID',
    'MUX_SIGNING_KEY_PRIVATE_KEY',
  ]

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingEnvVars.length > 0) {
    console.warn(
      `[config/index] Missing required environment variables: ${missingEnvVars.join(', ')}`,
    )
  }

  // Create the configuration object
  return {
    mux: {
      tokenId: process.env.MUX_TOKEN_ID || '',
      tokenSecret: process.env.MUX_TOKEN_SECRET || '',
      webhookSecret: process.env.MUX_WEBHOOK_SECRET || '',
      signingKeyId: process.env.MUX_SIGNING_KEY_ID || '',
      signingKeyPrivateKey: process.env.MUX_SIGNING_KEY_PRIVATE_KEY || '',
    },
    app: {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      environment: (process.env.NODE_ENV as Config['app']['environment']) || 'development',
    },
  }
}

// Export the configuration
export const config = loadConfig()

// Helper function to get configuration values
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return config[key]
}

// Export specific configurations for convenience
export const muxConfig = config.mux
export const appConfig = config.app
