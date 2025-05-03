import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createApiResponse, createErrorResponse } from '@/utils/apiResponse'
import { logger } from '@/utils/logger'

/**
 * GET /api/mux/test-webhook
 *
 * Test endpoint to trigger the webhook handler with a sample payload
 */
export async function GET(req: NextRequest) {
  try {
    logger.info({ context: 'test-webhook' }, '🧪 Test webhook endpoint called')

    // Read the sample webhook payload
    const samplePayloadPath = path.join(process.cwd(), 'src/app/api/mux/test-webhook.json')
    const samplePayload = fs.readFileSync(samplePayloadPath, 'utf-8')

    // Make a request to the webhook endpoint
    const webhookUrl = new URL('/api/mux/webhook', req.nextUrl.origin)
    logger.info({ context: 'test-webhook' }, `🔄 Sending request to ${webhookUrl.toString()}`)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mux-Signature': 'test-signature',
        'x-bypass-signature-verification': 'true'
      },
      body: samplePayload
    })

    // Check the response
    const responseStatus = response.status
    const responseText = await response.text()

    logger.info({ context: 'test-webhook' }, `📊 Webhook response: ${responseStatus}`, {
      status: responseStatus,
      body: responseText
    })

    return createApiResponse({
      success: responseStatus >= 200 && responseStatus < 300,
      message: `Webhook test completed with status ${responseStatus}`,
      data: {
        status: responseStatus,
        response: responseText
      }
    })
  } catch (error) {
    logger.error({ context: 'test-webhook', error }, '❌ Error testing webhook')
    return createErrorResponse('Error testing webhook', 500)
  }
}
