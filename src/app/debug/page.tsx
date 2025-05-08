'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function DebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testApi = async (endpoint: string) => {
    try {
      setLoading(true)
      addLog(`Testing ${endpoint}...`)

      // Make the fetch request
      addLog('Making fetch request...')
      const response = await fetch(endpoint, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })

      addLog(`Response status: ${response.status}`)

      // Get the response text
      addLog('Getting response text...')
      const text = await response.text()
      addLog(`Response text: ${text}`)

      // Try to parse the JSON
      let data
      try {
        addLog('Parsing JSON...')
        data = JSON.parse(text)
        addLog('JSON parsed successfully')
      } catch (error) {
        addLog(`Error parsing JSON: ${error instanceof Error ? error.message : String(error)}`)
        throw new Error('Failed to parse JSON response')
      }

      // Set the result
      setResult(data)
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`)
      setResult({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Test API Endpoints</CardTitle>
            <CardDescription>
              Test various API endpoints to see if they're working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => testApi('/api/cloud-integrations')} 
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
              
              <Button 
                onClick={() => testApi('/api/debug-globals')} 
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Debug Globals API'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              The result of the API call
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                <span>Loading...</span>
              </div>
            ) : result ? (
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-500">No result yet</div>
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
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
