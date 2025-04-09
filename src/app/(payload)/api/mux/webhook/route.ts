/**
 * Mux Webhook Handler
 *
 * Processes webhook events from Mux
 */

import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { createMuxService, createWebhookHandlerService } from '@/services/serviceFactory'
import { sendEventToClients } from '@/services/events/eventEmitter'
import { logError } from '@/utils/errorHandler'

/**
 * POST /api/mux/webhook
 *
 * Handle webhook events from Mux
 */
export async function POST(req: NextRequest) {
  try {
    // Get request body as text (we need the raw text for signature verification)
    const rawBody = await req.text()

    // Get signature from headers
    const signature = req.headers.get('mux-signature')
    if (!signature) {
      return createErrorResponse('Missing signature', 401)
    }

    // Initialize services
    const muxService = createMuxService()

    // Verify signature
    const isValid = muxService.verifyWebhookSignature(signature, rawBody)
    if (!isValid) {
      return createErrorResponse('Invalid signature', 401)
    }

    // Parse event
    const event = muxService.parseWebhookEvent(rawBody)
    if (!event) {
      return createErrorResponse('Invalid event payload', 400)
    }

    // Log the event
    console.log('Received Mux webhook event:', {
      type: event.type,
      data: JSON.stringify(event.data).substring(0, 200) + '...',
    })

    // Initialize Payload
    const payload = await getPayload({ config: configPromise })

    // Create webhook handler service
    const webhookHandlerService = createWebhookHandlerService(payload, sendEventToClients)

    // Handle the event
    await webhookHandlerService.handleEvent(event)

    return createApiResponse({ success: true })
  } catch (error: unknown) {
    logError(error, 'MuxWebhookHandler')
    return createErrorResponse('Error processing webhook', 500)
  }
}
