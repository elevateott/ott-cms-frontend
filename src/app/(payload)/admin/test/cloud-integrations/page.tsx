'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface TestResult {
  success: boolean
  message: string
  exists?: boolean
  data?: any
  allGlobals?: string[]
  error?: string
}

export default function TestCloudIntegrationsPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiResult, setApiResult] = useState<any | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [initResult, setInitResult] = useState<any | null>(null)
  const [initLoading, setInitLoading] = useState(false)

  const testCloudIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test/cloud-integrations')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Error testing cloud integrations',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const testApiEndpoint = async () => {
    try {
      setApiLoading(true)
      const response = await fetch('/api/cloud-integrations')
      const data = await response.json()
      setApiResult(data)
    } catch (error) {
      setApiResult({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setApiLoading(false)
    }
  }

  const initializeCloudIntegrations = async () => {
    try {
      setInitLoading(true)
      const response = await fetch('/api/init-cloud-integrations', {
        method: 'POST',
      })
      const data = await response.json()
      setInitResult(data)

      // If successful, refresh the test results
      if (data.success) {
        await testCloudIntegrations()
        await testApiEndpoint()
      }
    } catch (error) {
      setInitResult({
        success: false,
        message: 'Error initializing cloud integrations',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setInitLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Test Cloud Integrations</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Cloud Integrations Global</CardTitle>
            <CardDescription>
              Check if the cloud-integrations global exists in Payload CMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testCloudIntegrations} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Cloud Integrations Global'
              )}
            </Button>

            {result && (
              <div className="mt-4 p-4 rounded-md bg-gray-50 border">
                <h3 className="font-medium mb-2">Test Result:</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Success:</span> {result.success ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <span className="font-medium">Message:</span> {result.message}
                  </p>
                  {result.exists !== undefined && (
                    <p>
                      <span className="font-medium">Global Exists:</span>{' '}
                      {result.exists ? 'Yes' : 'No'}
                    </p>
                  )}
                  {result.error && (
                    <p>
                      <span className="font-medium">Error:</span> {result.error}
                    </p>
                  )}
                  {result.allGlobals && (
                    <div>
                      <span className="font-medium">Available Globals:</span>
                      <ul className="list-disc pl-6 mt-1">
                        {result.allGlobals.map((global) => (
                          <li key={global}>{global}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
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
            <Button onClick={testApiEndpoint} disabled={apiLoading}>
              {apiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing API...
                </>
              ) : (
                'Test API Endpoint'
              )}
            </Button>

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
          <CardTitle>Initialize Cloud Integrations</CardTitle>
          <CardDescription>
            Create the cloud-integrations global if it doesn't exist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={initializeCloudIntegrations} disabled={initLoading}>
            {initLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              'Initialize Cloud Integrations Global'
            )}
          </Button>

          {initResult && (
            <div className="mt-4 p-4 rounded-md bg-gray-50 border">
              <h3 className="font-medium mb-2">Initialization Result:</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Success:</span> {initResult.success ? 'Yes' : 'No'}
                </p>
                <p>
                  <span className="font-medium">Message:</span> {initResult.message}
                </p>
                {initResult.error && (
                  <p>
                    <span className="font-medium">Error:</span> {initResult.error}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium mb-2">Fix Instructions:</h3>
            <div className="space-y-4">
              <p>If the cloud-integrations global doesn't exist, you can:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Use the button above to initialize it automatically</li>
                <li>
                  Make sure the CloudIntegrations global is properly defined in{' '}
                  <code className="bg-gray-100 px-1 py-0.5 rounded">
                    src/globals/CloudIntegrations.ts
                  </code>
                </li>
                <li>
                  Ensure it's imported and registered in{' '}
                  <code className="bg-gray-100 px-1 py-0.5 rounded">src/payload.config.ts</code>
                </li>
                <li>Restart the server to apply the changes</li>
                <li>
                  After restarting, navigate to the admin panel and check if the Cloud Integrations
                  global appears under System Settings
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
