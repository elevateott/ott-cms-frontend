import { logger } from '@/utils/logger'
/**
 * Mux Webhook Handler
 *
 * Processes webhook events from Mux
 */

import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { createMuxService } from '@/services/mux'
import VideoAssetWebhookHandler from '@/services/mux/videoAssetWebhookHandler'
import { logError } from '@/utils/errorHandler'
import { eventService } from '@/services/eventService'
import { EVENTS } from '@/constants/events'

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
    logger.info({ context: 'webhook/route' }, 'Received Mux webhook event:', {
      type: event.type,
      data: JSON.stringify(event.data).substring(0, 200) + '...',
    })

    // Log more details for asset.ready events
    if (event.type === 'video.asset.ready') {
      logger.info({ context: 'webhook/route' }, 'Received video.asset.ready event with data:', {
        id: event.data.id,
        playback_ids: event.data.playback_ids,
        status: event.data.status,
        created_at: event.data.created_at,
      })
    }

    // Initialize Payload (needed for the webhook handlers to access the database)
    const payload = await getPayload({ config: configPromise })

    // Create a new instance of the webhook handler with the payload context
    const webhookHandler = new VideoAssetWebhookHandler(payload)

    // Emit events to notify clients
    if (event.type === 'video.asset.created') {
      try {
        await eventService.emit('VIDEO_UPLOAD_COMPLETED', {
          assetId: event.data?.id,
          playbackId: event.data?.playback_ids?.[0]?.id,
          timestamp: Date.now(),
          source: 'webhook',
        })
        logger.info({ context: 'webhook/route' }, 'Emitted VIDEO_UPLOAD_COMPLETED event')
      } catch (emitError) {
        logger.warn(
          { context: 'webhook/route', error: emitError },
          'Failed to emit VIDEO_UPLOAD_COMPLETED event',
        )
      }
    } else if (event.type === 'video.asset.ready') {
      try {
        await eventService.emit('VIDEO_STATUS_READY', {
          assetId: event.data?.id,
          playbackId: event.data?.playback_ids?.[0]?.id,
          timestamp: Date.now(),
          source: 'webhook',
        })
        logger.info({ context: 'webhook/route' }, 'Emitted VIDEO_STATUS_READY event')
      } catch (emitError) {
        logger.warn(
          { context: 'webhook/route', error: emitError },
          'Failed to emit VIDEO_STATUS_READY event',
        )
      }
    }

    // Handle the event
    try {
      await webhookHandler.handleEvent(event)
      logger.info({ context: 'webhook/route' }, 'Successfully handled webhook event')
    } catch (handlerError) {
      logger.warn(
        { context: 'webhook/route', error: handlerError },
        'Failed to handle webhook event, but events were emitted',
      )
    }

    return createApiResponse({ success: true })
  } catch (error: unknown) {
    logError(error, 'MuxWebhookHandler')
    return createErrorResponse('Error processing webhook', 500)
  }
}
