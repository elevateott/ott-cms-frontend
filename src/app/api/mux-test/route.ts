import { NextResponse } from 'next/server'
import payload from 'payload'
import { VideoRepository } from '@/repositories/videoRepository'
import { createWebhookHandlerService } from '@/services/serviceFactory'

export async function POST(request: Request) {
  const logs: string[] = []

  function addLog(message: string) {
    const timestamp = new Date().toISOString()
    logs.push(`[${timestamp}] ${message}`)
  }

  try {
    // Test Payload CMS connection
    addLog('Testing Payload CMS connection...')
    const collections = await payload.collections
    addLog('Found collections:')
    addLog(`ott-videos collection exists: ${Boolean(collections['ott-videos'])}`)

    // Test VideoRepository
    addLog('Testing VideoRepository...')
    const videoRepo = new VideoRepository()

    try {
      await videoRepo.findByMuxUploadId('test-upload-id')
      addLog('✅ findByMuxUploadId working')
    } catch (error) {
      addLog(`❌ findByMuxUploadId error: ${error.message}`)
    }

    try {
      await videoRepo.findByMuxAssetId('test-asset-id')
      addLog('✅ findByMuxAssetId working')
    } catch (error) {
      addLog(`❌ findByMuxAssetId error: ${error.message}`)
    }

    // Test WebhookHandler
    addLog('Testing WebhookHandler...')
    try {
      const webhookHandler = createWebhookHandlerService(payload)
      await webhookHandler.handleEvent({
        type: 'video.asset.created',
        data: {
          id: 'test-asset-id',
          playback_ids: [{ id: 'test-playback-id' }],
          upload_id: 'test-upload-id',
        },
      })
      addLog('✅ Asset created webhook working')
    } catch (error) {
      addLog(`❌ Asset created webhook error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      logs,
    })
  } catch (error) {
    addLog(`❌ Test failed: ${error.message}`)
    return NextResponse.json(
      {
        success: false,
        logs,
        error: error.message,
      },
      {
        status: 500,
      },
    )
  }
}
