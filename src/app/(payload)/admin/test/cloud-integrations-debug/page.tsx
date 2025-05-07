'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { clientLogger } from '@/utils/clientLogger'

interface CloudIntegrationSettings {
  dropboxAppKey: string | null
  googleApiKey: string | null
  googleClientId: string | null
  message?: string
  error?: string
}

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

const CloudIntegrationsDebugPage: React.FC = () => {
  const [settings, setSettings] = useState<CloudIntegrationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testDropboxResult, setTestDropboxResult] = useState<TestResult | null>(null)
  const [testGoogleResult, setTestGoogleResult] = useState<TestResult | null>(null)
  const [testingDropbox, setTestingDropbox] = useState(false)
  const [testingGoogle, setTestingGoogle] = useState(false)
  const [initResult, setInitResult] = useState<any>(null)
  const [initLoading, setInitLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      clientLogger.info('Fetching cloud integration settings', 'CloudIntegrationsDebugPage')

      const response = await fetch('/api/cloud-integrations', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      clientLogger.info(
        'Received response from /api/cloud-integrations', 
        'CloudIntegrationsDebugPage', 
        { status: response.status, data }
      )

      if (data.error) {
        throw new Error(data.error)
      }

      setSettings(data)
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
      clientLogger.error(
        'Error fetching cloud integration settings',
        'CloudIntegrationsDebugPage',
        {
          error: errorMessage,
        },
      )
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const testDropboxSDK = async () => {
    try {
      setTestingDropbox(true)
      setTestDropboxResult(null)
      
      // Check if Dropbox app key is available
      if (!settings?.dropboxAppKey) {
        setTestDropboxResult({
          success: false,
          message: 'Dropbox app key is not configured',
        })
        return
      }
      
      // Create a script element to load the Dropbox SDK
      const script = document.createElement('script')
      script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
      script.id = 'dropbox-sdk-test'
      script.setAttribute('data-app-key', settings.dropboxAppKey)
      
      // Create a promise to wait for the script to load
      const loadPromise = new Promise<TestResult>((resolve, reject) => {
        script.onload = () => {
          // Check if Dropbox object is available
          if (typeof window !== 'undefined' && window.Dropbox) {
            resolve({
              success: true,
              message: 'Dropbox SDK loaded successfully',
              data: {
                sdkAvailable: true,
                appKeyLength: settings.dropboxAppKey?.length || 0,
                appKeyType: typeof settings.dropboxAppKey,
              },
            })
          } else {
            resolve({
              success: false,
              message: 'Dropbox SDK loaded but Dropbox object is not available',
              data: {
                sdkAvailable: false,
                appKeyLength: settings.dropboxAppKey?.length || 0,
                appKeyType: typeof settings.dropboxAppKey,
              },
            })
          }
        }
        
        script.onerror = () => {
          reject(new Error('Failed to load Dropbox SDK'))
        }
        
        // Set a timeout in case the script never loads
        setTimeout(() => {
          reject(new Error('Timeout loading Dropbox SDK'))
        }, 5000)
      })
      
      // Add the script to the document
      document.body.appendChild(script)
      
      // Wait for the script to load
      const result = await loadPromise
      setTestDropboxResult(result)
      
      // Clean up
      document.body.removeChild(script)
    } catch (error) {
      setTestDropboxResult({
        success: false,
        message: 'Error testing Dropbox SDK',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setTestingDropbox(false)
    }
  }

  const testGoogleSDK = async () => {
    try {
      setTestingGoogle(true)
      setTestGoogleResult(null)
      
      // Check if Google API key and client ID are available
      if (!settings?.googleApiKey || !settings?.googleClientId) {
        setTestGoogleResult({
          success: false,
          message: 'Google API key or client ID is not configured',
          data: {
            hasApiKey: !!settings?.googleApiKey,
            hasClientId: !!settings?.googleClientId,
          },
        })
        return
      }
      
      // Create a script element to load the Google API SDK
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.id = 'google-api-test'
      
      // Create a promise to wait for the script to load
      const loadPromise = new Promise<TestResult>((resolve, reject) => {
        script.onload = () => {
          // Check if gapi object is available
          if (typeof window !== 'undefined' && window.gapi) {
            resolve({
              success: true,
              message: 'Google API SDK loaded successfully',
              data: {
                sdkAvailable: true,
                apiKeyLength: settings.googleApiKey?.length || 0,
                apiKeyType: typeof settings.googleApiKey,
                clientIdLength: settings.googleClientId?.length || 0,
                clientIdType: typeof settings.googleClientId,
              },
            })
          } else {
            resolve({
              success: false,
              message: 'Google API SDK loaded but gapi object is not available',
              data: {
                sdkAvailable: false,
                apiKeyLength: settings.googleApiKey?.length || 0,
                apiKeyType: typeof settings.googleApiKey,
                clientIdLength: settings.googleClientId?.length || 0,
                clientIdType: typeof settings.googleClientId,
              },
            })
          }
        }
        
        script.onerror = () => {
          reject(new Error('Failed to load Google API SDK'))
        }
        
        // Set a timeout in case the script never loads
        setTimeout(() => {
          reject(new Error('Timeout loading Google API SDK'))
        }, 5000)
      })
      
      // Add the script to the document
      document.body.appendChild(script)
      
      // Wait for the script to load
      const result = await loadPromise
      setTestGoogleResult(result)
      
      // Clean up
      document.body.removeChild(script)
    } catch (error) {
      setTestGoogleResult({
        success: false,
        message: 'Error testing Google API SDK',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setTestingGoogle(false)
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

      // If successful, refresh the settings
      if (data.success) {
        await fetchSettings()
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
      <h1 className="text-2xl font-bold">Cloud Integrations Debug</h1>
      <p className="text-gray-500">
        This page helps diagnose issues with cloud storage integrations.
      </p>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="initialize">Initialize</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Integration Settings</CardTitle>
              <CardDescription>
                Current settings from the cloud-integrations global.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
                  <span>Loading settings...</span>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : settings ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Dropbox App Key</h3>
                    <div className="flex items-center mt-1">
                      {settings.dropboxAppKey ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          <span>
                            Present ({typeof settings.dropboxAppKey}, length:{' '}
                            {settings.dropboxAppKey.length})
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <span>Not configured</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium">Google API Key</h3>
                    <div className="flex items-center mt-1">
                      {settings.googleApiKey ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          <span>
                            Present ({typeof settings.googleApiKey}, length:{' '}
                            {settings.googleApiKey.length})
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <span>Not configured</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium">Google Client ID</h3>
                    <div className="flex items-center mt-1">
                      {settings.googleClientId ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                          <span>
                            Present ({typeof settings.googleClientId}, length:{' '}
                            {settings.googleClientId.length})
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-500 mr-2" />
                          <span>Not configured</span>
                        </>
                      )}
                    </div>
                  </div>

                  {settings.message && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Message</AlertTitle>
                      <AlertDescription>{settings.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Settings</AlertTitle>
                  <AlertDescription>No settings found.</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={fetchSettings} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh Settings'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Dropbox SDK</CardTitle>
              <CardDescription>
                Test loading the Dropbox SDK with the current app key.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testDropboxResult && (
                <Alert variant={testDropboxResult.success ? 'default' : 'destructive'}>
                  {testDropboxResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {testDropboxResult.success ? 'Success' : 'Error'}
                  </AlertTitle>
                  <AlertDescription>
                    {testDropboxResult.message}
                    {testDropboxResult.error && (
                      <div className="mt-2 text-sm">
                        Error: {testDropboxResult.error}
                      </div>
                    )}
                    {testDropboxResult.data && (
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                        {JSON.stringify(testDropboxResult.data, null, 2)}
                      </pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testDropboxSDK} disabled={testingDropbox || !settings}>
                {testingDropbox ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Dropbox SDK'
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Google API SDK</CardTitle>
              <CardDescription>
                Test loading the Google API SDK with the current API key and client ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testGoogleResult && (
                <Alert variant={testGoogleResult.success ? 'default' : 'destructive'}>
                  {testGoogleResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {testGoogleResult.success ? 'Success' : 'Error'}
                  </AlertTitle>
                  <AlertDescription>
                    {testGoogleResult.message}
                    {testGoogleResult.error && (
                      <div className="mt-2 text-sm">
                        Error: {testGoogleResult.error}
                      </div>
                    )}
                    {testGoogleResult.data && (
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                        {JSON.stringify(testGoogleResult.data, null, 2)}
                      </pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={testGoogleSDK} disabled={testingGoogle || !settings}>
                {testingGoogle ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Google API SDK'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="initialize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Initialize Cloud Integrations</CardTitle>
              <CardDescription>
                Initialize the cloud-integrations global if it doesn't exist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initResult && (
                <Alert variant={initResult.success ? 'default' : 'destructive'}>
                  {initResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {initResult.success ? 'Success' : 'Error'}
                  </AlertTitle>
                  <AlertDescription>
                    {initResult.message}
                    {initResult.error && (
                      <div className="mt-2 text-sm">
                        Error: {initResult.error}
                      </div>
                    )}
                    {initResult.data && (
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                        {JSON.stringify(initResult.data, null, 2)}
                      </pre>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={initializeCloudIntegrations} disabled={initLoading}>
                {initLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Initialize Cloud Integrations'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CloudIntegrationsDebugPage
