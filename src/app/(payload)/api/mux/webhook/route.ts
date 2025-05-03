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
import { getMuxSettings } from '@/utilities/getMuxSettings'
import { handleLiveStreamWebhook } from '@/hooks/mux/handleLiveStreamWebhook'
import { handleSimulcastWebhook } from '@/hooks/mux/handleSimulcastWebhook'
import { handleRecordingWebhook } from '@/hooks/mux/handleRecordingWebhook'
import { handleSimulatedLiveWebhook } from '@/hooks/mux/handleSimulatedLiveWebhook'

/**
 * POST /api/mux/webhook
 *
 * Handle webhook events from Mux
 */
export async function POST(req: NextRequest) {
  // Log immediately when the webhook endpoint is called
  logger.info(
    { context: 'webhook/route' },
    '🚨 WEBHOOK ENDPOINT CALLED - Request received at /api/mux/webhook',
  )

  // Log request details
  logger.info({ context: 'webhook/route' }, '📝 Request details:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  })

  try {
    logger.info({ context: 'webhook/route' }, '🔍 Starting to process webhook request')

    // Get request body as text (we need the raw text for signature verification)
    const rawBody = await req.text()
    logger.info(
      { context: 'webhook/route' },
      '📦 Received raw body (first 200 chars):',
      rawBody.substring(0, 200) + (rawBody.length > 200 ? '...' : ''),
    )

    // Get signature from headers
    const signature = req.headers.get('mux-signature')
    logger.info(
      { context: 'webhook/route' },
      '🔑 Mux signature from headers:',
      signature || 'MISSING',
    )

    if (!signature) {
      logger.warn(
        { context: 'webhook/route' },
        '⚠️ Webhook rejected: Missing Mux signature in request headers',
      )
      return createErrorResponse('Missing signature', 401)
    }

    // Initialize services
    const muxService = await createMuxService()
    const muxSettings = await getMuxSettings()

    // Verify signature
    try {
      logger.info({ context: 'webhook/route' }, '🔐 Attempting to verify Mux webhook signature')

      // Check if webhook secret is configured
      const webhookSecret = muxSettings.webhookSecret
      if (!webhookSecret) {
        logger.error(
          { context: 'webhook/route' },
          '🚨 Mux webhook secret is not configured in global settings or environment variables!',
        )
      } else {
        logger.info(
          { context: 'webhook/route' },
          `🔑 Mux webhook secret is configured (first 4 chars: ${webhookSecret.substring(0, 4)}...)`,
        )
      }

      // Check for development bypass header
      const bypassVerification =
        process.env.NODE_ENV === 'development' &&
        req.headers.get('x-bypass-signature-verification') === 'true'

      if (bypassVerification) {
        logger.warn(
          { context: 'webhook/route' },
          '⚠️ DEVELOPMENT MODE: Bypassing signature verification due to x-bypass-signature-verification header',
        )
      } else {
        // Verify the signature
        const isValid = await muxService.verifyWebhookSignature(signature, rawBody)

        if (!isValid) {
          logger.warn(
            { context: 'webhook/route' },
            '⚠️ Webhook rejected: Invalid Mux webhook signature',
          )
          return createErrorResponse('Invalid signature', 401)
        }

        logger.info({ context: 'webhook/route' }, '✅ Mux webhook signature verified successfully')
      }
    } catch (error) {
      logger.error(
        { context: 'webhook/route' },
        '🚨 Error verifying Mux webhook signature:',
        error instanceof Error ? error.message : String(error),
      )

      // Log more details about the error
      if (error instanceof Error) {
        logger.error({ context: 'webhook/route' }, '🔍 Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
      }

      return createErrorResponse('Error verifying signature', 401)
    }

    // Parse event
    logger.info({ context: 'webhook/route' }, '🔍 Parsing webhook event')
    const event = muxService.parseWebhookEvent(rawBody)

    if (!event) {
      logger.warn(
        { context: 'webhook/route' },
        '⚠️ Webhook rejected: Failed to parse event payload',
      )
      return createErrorResponse('Invalid event payload', 400)
    }

    // Log the full event in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(
        { context: 'webhook/route' },
        'Full webhook event:',
        JSON.stringify(event, null, 2),
      )
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
    logger.info({ context: 'webhook/route' }, '🔍 Initializing Payload for database access')
    const payload = await getPayload({ config: configPromise })

    if (!payload) {
      logger.error({ context: 'webhook/route' }, '❌ Failed to initialize Payload')
      return createErrorResponse('Failed to initialize database connection', 500)
    }

    logger.info({ context: 'webhook/route' }, '✅ Payload initialized successfully', {
      payloadInitialized: !!payload,
    })

    // Create a new instance of the webhook handler with the payload context
    logger.info({ context: 'webhook/route' }, '🔍 Creating VideoAssetWebhookHandler with payload')
    const webhookHandler = new VideoAssetWebhookHandler({ payload })

    // Check if webhook handler is initialized
    if (!webhookHandler) {
      logger.error({ context: 'webhook/route' }, '❌ Failed to create webhook handler')
      return createErrorResponse('Failed to create webhook handler', 500)
    }

    logger.info({ context: 'webhook/route' }, '✅ VideoAssetWebhookHandler created successfully')

    // Emit events to notify clients
    if (event.type === 'video.asset.created') {
      try {
        // Use the string value directly to avoid TypeScript errors
        await eventService.emit('VIDEO_UPLOAD_COMPLETED' as any, {
          assetId: event.data?.id,
          playbackId: event.data?.playback_ids?.[0]?.id,
          uploadId: event.data?.upload_id,
          timestamp: Date.now(),
          source: 'webhook',
        })
        logger.info({ context: 'webhook/route' }, '✅ Emitted VIDEO_UPLOAD_COMPLETED event')
      } catch (emitError) {
        logger.warn(
          { context: 'webhook/route', error: emitError },
          '⚠️ Failed to emit VIDEO_UPLOAD_COMPLETED event',
        )
      }
    } else if (event.type === 'video.asset.ready') {
      try {
        // Use the string value directly to avoid TypeScript errors
        await eventService.emit('VIDEO_STATUS_READY' as any, {
          assetId: event.data?.id,
          playbackId: event.data?.playback_ids?.[0]?.id,
          uploadId: event.data?.upload_id,
          timestamp: Date.now(),
          source: 'webhook',
        })
        logger.info({ context: 'webhook/route' }, '✅ Emitted VIDEO_STATUS_READY event')
      } catch (emitError) {
        logger.warn(
          { context: 'webhook/route', error: emitError },
          '⚠️ Failed to emit VIDEO_STATUS_READY event',
        )
      }
    }

    // Handle the event
    try {
      // Check if this is a simulcast target event
      if (event.type.includes('simulcast_target')) {
        logger.info(
          { context: 'webhook/route' },
          '🔄 Detected simulcast target event, calling handleSimulcastWebhook with event type:',
          event.type,
        )

        // Handle simulcast target event
        await handleSimulcastWebhook(event)

        logger.info(
          { context: 'webhook/route' },
          '✅ Successfully handled simulcast target webhook event',
        )
      }
      // Check if this is a simulated live event
      else if (event.type.includes('simulcast') && !event.type.includes('simulcast_target')) {
        logger.info(
          { context: 'webhook/route' },
          '🔄 Detected simulated live event, calling handleSimulatedLiveWebhook with event type:',
          event.type,
        )

        // Handle simulated live event
        await handleSimulatedLiveWebhook(event)

        logger.info(
          { context: 'webhook/route' },
          '✅ Successfully handled simulated live webhook event',
        )
      }
      // Check if this is a live stream event
      else if (event.type.includes('live_stream')) {
        logger.info(
          { context: 'webhook/route' },
          '🔄 Detected live stream event, calling handleLiveStreamWebhook with event type:',
          event.type,
        )

        // Handle live stream event
        await handleLiveStreamWebhook(event)

        logger.info(
          { context: 'webhook/route' },
          '✅ Successfully handled live stream webhook event',
        )
      }
      // Check if this is a recording event (asset with live_stream_id)
      else if (
        (event.type === 'video.asset.created' || event.type === 'video.asset.ready') &&
        event.data?.live_stream_id
      ) {
        logger.info(
          { context: 'webhook/route' },
          '🔄 Detected recording event, calling handleRecordingWebhook with event type:',
          event.type,
        )

        // Handle recording event
        await handleRecordingWebhook(event)

        logger.info({ context: 'webhook/route' }, '✅ Successfully handled recording webhook event')
      } else {
        // Handle video asset event
        logger.info(
          { context: 'webhook/route' },
          '🔄 Calling webhookHandler.handleEvent with event type:',
          event.type,
        )

        // Check if the handleEvent method exists
        if (typeof webhookHandler.handleEvent !== 'function') {
          logger.error(
            { context: 'webhook/route' },
            '❌ webhookHandler.handleEvent is not a function',
            { webhookHandlerMethods: Object.keys(webhookHandler) },
          )
          return createErrorResponse('Webhook handler implementation error', 500)
        }

        // Call the handleEvent method
        logger.info(
          { context: 'webhook/route' },
          '🔍 DEBUG: About to call webhookHandler.handleEvent',
        )

        await webhookHandler.handleEvent(event)

        logger.info(
          { context: 'webhook/route' },
          '✅ Successfully handled video asset webhook event',
        )
      }
    } catch (handlerError) {
      logger.error(
        { context: 'webhook/route', error: handlerError },
        '❌ Failed to handle webhook event, but events were emitted',
      )

      // Log more details about the error
      if (handlerError instanceof Error) {
        logger.error({ context: 'webhook/route' }, '🔍 Error details:', {
          name: handlerError.name,
          message: handlerError.message,
          stack: handlerError.stack,
        })
      }
    }

    return createApiResponse({ success: true })
  } catch (error: unknown) {
    logError(error, 'MuxWebhookHandler')
    return createErrorResponse('Error processing webhook', 500)
  }
}
