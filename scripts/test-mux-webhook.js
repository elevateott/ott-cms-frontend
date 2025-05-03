/**
 * Test Mux Webhook Script
 *
 * This script simulates a Mux webhook event to test the webhook handler.
 * It sends a POST request to the webhook endpoint with a sample event payload.
 */

import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.development' })

// Force the port to 3005 for testing
const SERVER_URL = 'http://localhost:3005'
const WEBHOOK_URL = `${SERVER_URL}/api/mux/webhook`
const TEST_WEBHOOK_URL = `${SERVER_URL}/api/mux/test/webhook`

console.log('Using server URL:', SERVER_URL)

// Sample asset.created event
const assetCreatedEvent = {
  type: 'video.asset.created',
  data: {
    id: 'test-asset-id-' + Date.now(),
    playback_ids: [
      {
        id: 'test-playback-id-' + Date.now(),
        policy: 'public',
      },
    ],
    upload_id: 'test-upload-id-' + Date.now(),
    status: 'preparing',
    created_at: new Date().toISOString(),
  },
}

// Sample asset.ready event
const assetReadyEvent = {
  type: 'video.asset.ready',
  data: {
    id: 'test-asset-id-' + Date.now(),
    playback_ids: [
      {
        id: 'test-playback-id-' + Date.now(),
        policy: 'public',
      },
    ],
    status: 'ready',
    duration: 120.5,
    aspect_ratio: '16:9',
    created_at: new Date().toISOString(),
  },
}

// Function to send a webhook event
async function sendWebhookEvent(event) {
  console.log(`Sending ${event.type} event to ${WEBHOOK_URL}...`)

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })

    console.log(`Response status: ${response.status}`)

    // Check if the response is OK
    if (!response.ok) {
      const text = await response.text()
      console.error('Error response from server:', text)
      throw new Error(`Server responded with status ${response.status}: ${text}`)
    }

    // Try to parse as JSON
    try {
      const data = await response.json()
      console.log('Response data:', data)
      return data
    } catch (jsonError) {
      const text = await response.text()
      console.log('Response text (not JSON):', text)
      return { text }
    }
  } catch (error) {
    console.error('Error sending webhook event:', error)
    throw error
  }
}

// Function to test the test endpoint
async function testEndpoint() {
  console.log(`Testing the test endpoint at ${TEST_WEBHOOK_URL}...`)

  try {
    const response = await fetch(TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true, timestamp: Date.now() }),
    })

    console.log(`Test endpoint response status: ${response.status}`)

    if (!response.ok) {
      const text = await response.text()
      console.error('Error response from test endpoint:', text)
      return false
    }

    const data = await response.json()
    console.log('Test endpoint response data:', data)
    return true
  } catch (error) {
    console.error('Error testing endpoint:', error)
    return false
  }
}

// Main function
async function main() {
  const eventType = process.argv[2] || 'created'
  const testFirst = process.argv.includes('--test-first')

  if (testFirst) {
    console.log('Testing the test endpoint first...')
    const testSuccess = await testEndpoint()
    if (!testSuccess) {
      console.error('Test endpoint failed, aborting webhook test')
      process.exit(1)
    }
    console.log('Test endpoint successful, proceeding with webhook test')
  }

  console.log(`Testing Mux webhook with event type: ${eventType}`)

  try {
    if (eventType === 'created') {
      await sendWebhookEvent(assetCreatedEvent)
    } else if (eventType === 'ready') {
      await sendWebhookEvent(assetReadyEvent)
    } else if (eventType === 'test') {
      await testEndpoint()
    } else {
      console.error(`Unknown event type: ${eventType}`)
      console.log('Available event types: created, ready, test')
      process.exit(1)
    }
  } catch (error) {
    console.error('Error in main function:', error)
    process.exit(1)
  }
}

// Run the main function
main()
