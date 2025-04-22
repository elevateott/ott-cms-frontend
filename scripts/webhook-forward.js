/**
 * Webhook Forwarding Script
 *
 * This script sets up a smee-client to forward webhook events from
 * a smee.io channel to your local development server.
 */

import SmeeClient from 'smee-client'
import dotenv from 'dotenv'

// Load environment variables from .env.development if it exists
dotenv.config({ path: '.env.development' })

// Get the smee URL from environment variable or use a default
const source = process.env.WEBHOOK_PROXY_URL || 'https://smee.io/new'
const target = process.env.WEBHOOK_TARGET_URL || 'http://localhost:3000/api/mux/webhook'

console.log(`Forwarding webhooks from ${source} to ${target}`)

const smee = new SmeeClient({
  source,
  target,
  logger: {
    info: (...args) => console.log('[Webhook Forwarder]', ...args),
    error: (...args) => console.error('[Webhook Forwarder]', ...args),
  },
})

const events = smee.start()

// Log when the forwarder starts
console.log('Webhook forwarder started')
console.log('Press Ctrl+C to stop')

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Stopping webhook forwarder...')
  events.close()
  process.exit(0)
})
