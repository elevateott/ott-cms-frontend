'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { DropboxButton } from '@/components/buttons/DropboxButton'
import { GoogleDriveButton } from '@/components/buttons/GoogleDriveButton'

export default function DirectCloudButtonsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const handleFileSelected = (file: File) => {
    setFile(file)
    addLog(`File selected: ${file.name} (${file.size} bytes)`)
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        addLog(`Error: ${errorMessage}`)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Cloud Provider Buttons Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Cloud Provider Buttons</CardTitle>
            <CardDescription>Using direct API endpoint instead of Payload CMS</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2 h-10 px-4 py-2 border border-input rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading cloud providers...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-md">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {settings?.dropboxAppKey && (
                  <DropboxButton
                    appKey={settings.dropboxAppKey}
                    onFileSelected={handleFileSelected}
                  />
                )}

                {settings?.googleClientId && (
                  <GoogleDriveButton
                    clientId={settings.googleClientId}
                    onFileSelected={handleFileSelected}
                  />
                )}
              </div>
            )}

            {file && (
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                <p className="font-medium">File Selected:</p>
                <p>Name: {file.name}</p>
                <p>Size: {file.size} bytes</p>
                <p>Type: {file.type}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Cloud integration settings from direct API</CardDescription>
          </CardHeader>
          <CardContent>
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
            ) : settings ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap">{JSON.stringify(settings, null, 2)}</pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm overflow-auto max-h-96">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet</div>
            ) : (
              logs.map((log, index) => <div key={index}>{log}</div>)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
