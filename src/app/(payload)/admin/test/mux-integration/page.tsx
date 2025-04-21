'use client'

import { useState } from 'react'

export default function MuxIntegrationTestPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [testStatus, setTestStatus] = useState<Record<string, boolean>>({})

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`])
  }

  const markTest = (testName: string, passed: boolean) => {
    setTestStatus(prev => ({ ...prev, [testName]: passed }))
  }

  const ensureCollection = async () => {
    try {
      addLog('Ensuring ott-videos collection exists...')
      const response = await fetch('/api/init-collections', {
        method: 'POST',
      })
      const result = await response.json()

      if (result.success) {
        addLog('✅ Collection setup successful')
        markTest('collection-setup', true)
        return true
      } else {
        addLog(`❌ Collection setup failed: ${result.error}`)
        markTest('collection-setup', false)
        return false
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ Collection setup error: ${errorMessage}`)
      markTest('collection-setup', false)
      return false
    }
  }

  const runTests = async () => {
    // First ensure collection exists
    const collectionReady = await ensureCollection()
    if (!collectionReady) {
      addLog('Stopping tests due to collection setup failure')
      return
    }

    // Continue with existing tests
    await testPayloadConnection()
    await testVideoRepository()
    await testWebhookHandler()
  }

  const testPayloadConnection = async () => {
    try {
      addLog('Testing Payload CMS connection...')
      const response = await fetch('/api/test/payload-connection')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to connect to Payload CMS')
      }

      addLog(`Found collections: ${data.collections.join(', ')}`)
      const hasOttVideos = data.collections.includes('ott-videos')
      addLog(`ott-videos collection exists: ${hasOttVideos}`)
      markTest('payload-connection', true)
      markTest('ott-videos-collection', hasOttVideos)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ Payload connection error: ${errorMessage}`)
      markTest('payload-connection', false)
      markTest('ott-videos-collection', false)
    }
  }

  const testVideoRepository = async () => {
    try {
      addLog('Testing VideoRepository...')

      // Test through API endpoint instead of direct repository usage
      const response = await fetch('/api/test/video-repository', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testUploadId: 'test-upload-id',
          testAssetId: 'test-asset-id'
        })
      })

      const data = await response.json()

      if (data.success) {
        addLog('✅ VideoRepository tests passed')
        markTest('video-repo-upload', true)
        markTest('video-repo-asset', true)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ VideoRepository test error: ${errorMessage}`)
      markTest('video-repo-upload', false)
      markTest('video-repo-asset', false)
    }
  }

  const testWebhookHandler = async () => {
    try {
      addLog('Testing WebhookHandler...')

      // Test through API endpoint instead of direct handler usage
      const response = await fetch('/api/test/webhook-handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'video.asset.created',
          data: {
            upload_id: 'test-upload-id',
            asset_id: 'test-asset-id',
            playback_ids: [{ policy: 'public', id: 'test-playback-id' }],
            status: 'preparing'
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        addLog('✅ Webhook handler tests passed')
        markTest('webhook-handler-init', true)
        markTest('webhook-asset-created', true)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ WebhookHandler test error: ${errorMessage}`)
      markTest('webhook-handler-init', false)
      markTest('webhook-asset-created', false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mux Integration Tests</h1>
      <button
        onClick={runTests}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Run Tests
      </button>
      <div className="space-y-2">
        {logs.map((log, index) => (
          <pre key={index} className="bg-gray-100 p-2 rounded">
            {log}
          </pre>
        ))}
      </div>
    </div>
  )
}





