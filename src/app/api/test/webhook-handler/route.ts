import { NextResponse } from 'next/server'
import { createWebhookHandlerService } from '@/services/serviceFactory'

export async function POST(request: Request) {
  try {
    const webhookEvent = await request.json()
    const handler = createWebhookHandlerService()
    await handler.handleEvent(webhookEvent)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
