'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface CloudIntegrationSettings {
  dropboxAppKey: string | null
  googleApiKey: string | null
  googleClientId: string | null
  onedriveClientId: string | null
  error?: string
  message?: string
}

export default function TestCloudIntegrationsPage() {
  const [settings, setSettings] = useState<CloudIntegrationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        addLog('Fetching cloud integration settings...')

        const response = await fetch('/api/cloud-integrations', {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })

        addLog(`Response status: ${response.status}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch cloud integration settings: ${response.status}`)
        }

        const data = await response.json()
        addLog(`Received data: ${JSON.stringify(data, null, 2)}`)

        setSettings(data)
      } catch (error) {
        console.error('Error fetching cloud integration settings:', error)
        addLog(`Error: ${error instanceof Error ? error.message : String(error)}`)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cloud Integration Settings Test</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Status</h2>
        {loading ? (
          <div className="flex items-center">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
            <span>Loading settings...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg">
            <p className="font-medium">Settings loaded successfully</p>
          </div>
        )}
      </div>

      {settings && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap">{JSON.stringify(settings, null, 2)}</pre>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p>No logs yet</p>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
        <ul className="list-disc pl-6">
          <li className="mb-2">
            Go to the CMS admin panel and configure cloud integration settings
          </li>
          <li className="mb-2">
            Navigate to <code>System Settings &gt; Cloud Integrations</code>
          </li>
          <li className="mb-2">Enable cloud integrations and add your API keys</li>
          <li className="mb-2">Refresh this page to see the updated settings</li>
        </ul>
      </div>
    </div>
  )
}
