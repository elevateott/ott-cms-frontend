'use client'

import React, { useState } from 'react'
import CloudProviderButtons from '@/components/video/CloudProviderButtons'
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

export default function DebugCloudButtonsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [apiResult, setApiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const handleFileSelected = (file: File) => {
    setFile(file)
    addLog(`File selected: ${file.name} (${file.size} bytes)`)
  }

  const testCloudIntegrationsApi = async (endpoint: string) => {
    try {
      setLoading(true)
      addLog(`Testing ${endpoint} API endpoint...`)

      const response = await fetch(endpoint, {
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

      addLog(`Response data: ${JSON.stringify(data, null, 2)}`)
      setApiResult(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`Error: ${errorMessage}`)
      setApiResult({ error: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Debug Cloud Provider Buttons</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Cloud Provider Buttons</CardTitle>
            <CardDescription>Test the CloudProviderButtons component</CardDescription>
          </CardHeader>
          <CardContent>
            <CloudProviderButtons onFileSelected={handleFileSelected} />

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
            <CardTitle>Test API Endpoint</CardTitle>
            <CardDescription>Test the /api/cloud-integrations endpoint directly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => testCloudIntegrationsApi('/api/cloud-integrations')}
                disabled={loading}
                variant="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Cloud Integrations API'
                )}
              </Button>
            </div>

            {apiResult && (
              <div className="mt-4 p-4 rounded-md bg-gray-50 border">
                <h3 className="font-medium mb-2">API Result:</h3>
                <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                  {JSON.stringify(apiResult, null, 2)}
                </pre>
              </div>
            )}
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
