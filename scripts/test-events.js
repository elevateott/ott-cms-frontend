/**
 * Test Events Script
 *
 * This script tests the event system by making a direct API call to the webhook endpoint.
 */

import fetch from 'node-fetch'

// Define the webhook URL
const WEBHOOK_URL = 'http://localhost:3000/api/mux/webhook'

// Create a test webhook payload
const testPayload = {
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

// Send the webhook
async function sendWebhook() {
  console.log(`Sending webhook to ${WEBHOOK_URL}...`)

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })

    console.log(`Response status: ${response.status}`)

    if (!response.ok) {
      const text = await response.text()
      console.error('Error response from server:', text)
      process.exit(1)
    }

    const data = await response.json()
    console.log('Response data:', data)
    console.log('Webhook sent successfully')
  } catch (error) {
    console.error('Error sending webhook:', error)
    process.exit(1)
  }
}

// Run the function
sendWebhook()
