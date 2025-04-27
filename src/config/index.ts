/**
 * Centralized configuration module
 *
 * This module provides a type-safe way to access configuration values
 * from environment variables and other sources.
 *
 * Note: Mux configuration has been moved to global settings in streamingSettings.
 * Use the getMuxSettings utility from @/utilities/getMuxSettings instead.
 */

// Define the configuration schema
export interface Config {
  app: {
    baseUrl: string
    environment: 'development' | 'production' | 'test'
  }
}

// Load and validate configuration
function loadConfig(): Config {
  // Create the configuration object
  return {
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
export const appConfig = config.app
