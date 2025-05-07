'use client'

import { useState, useEffect } from 'react'
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
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function DropboxDebugPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [dropboxLoaded, setDropboxLoaded] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`,
    ])
  }

  // Fetch cloud integration settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        addLog('Fetching cloud integration settings...')
        setLoading(true)

        const response = await fetch('/api/cloud-integrations')

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        addLog(`Received settings: ${JSON.stringify(data, null, 2)}`)

        setSettings(data)

        // Check if Dropbox app key exists
        if (data.dropboxAppKey) {
          addLog(
            `Found Dropbox app key (${typeof data.dropboxAppKey}, length: ${data.dropboxAppKey.length})`,
          )
        } else {
          addLog('No Dropbox app key found in settings')
        }
      } catch (error) {
        addLog(`Error fetching settings: ${error instanceof Error ? error.message : String(error)}`)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Load Dropbox SDK when settings are available
  useEffect(() => {
    if (!settings?.dropboxAppKey) {
      addLog('No Dropbox app key available, skipping SDK load')
      return
    }

    addLog(`Attempting to load Dropbox SDK with key: ${settings.dropboxAppKey.substring(0, 3)}...`)

    // Dropbox requires the script ID to be specifically "dropboxjs"
    const scriptId = 'dropboxjs'
    const existingScript = document.getElementById(scriptId)

    // Avoid duplicate scripts
    if (existingScript) {
      addLog('Dropbox script already exists')
      if (window.Dropbox) {
        addLog('Dropbox object already available')
        setDropboxLoaded(true)
      }
      return
    }

    // Create script exactly as shown in Dropbox documentation
    const script = document.createElement('script')
    script.id = scriptId // Must be "dropboxjs"
    script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
    script.type = 'text/javascript'
    script.setAttribute('data-app-key', settings.dropboxAppKey)

    addLog(
      `Created script element with attributes: id=${script.id}, data-app-key=${script.getAttribute('data-app-key')}`,
    )

    script.onload = () => {
      addLog('Dropbox SDK script loaded')

      if (window.Dropbox) {
        addLog('Dropbox object is available')
        setDropboxLoaded(true)
      } else {
        addLog('ERROR: Dropbox SDK loaded, but Dropbox object missing')

        // Log script attributes for debugging
        addLog(
          `Script attributes: id=${script.id}, data-app-key=${script.getAttribute('data-app-key')}`,
        )
      }
    }

    script.onerror = (e) => {
      addLog(`ERROR: Failed to load Dropbox SDK: ${e}`)
    }

    document.body.appendChild(script)
    addLog('Appended script to document body')
  }, [settings?.dropboxAppKey])

  const handleDropboxTest = () => {
    if (!window.Dropbox) {
      addLog('ERROR: Dropbox object not available')
      return
    }

    try {
      addLog('Opening Dropbox chooser')
      window.Dropbox.choose({
        success: (files: any) => {
          addLog(`Dropbox chooser success: ${files.length} files selected`)
        },
        cancel: () => {
          addLog('Dropbox selection cancelled')
        },
        linkType: 'direct',
        multiselect: false,
        extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
      })
    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Dropbox Integration Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dropbox Settings</CardTitle>
            <CardDescription>Current cloud integration settings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading settings...</p>
            ) : settings ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Dropbox App Key:</h3>
                  <p className="font-mono bg-gray-100 p-2 rounded">
                    {settings.dropboxAppKey ? (
                      <>
                        {settings.dropboxAppKey.substring(0, 4)}...
                        <span className="text-gray-500 text-xs ml-2">
                          (Type: {typeof settings.dropboxAppKey}, Length:{' '}
                          {settings.dropboxAppKey.length})
                        </span>
                      </>
                    ) : (
                      <span className="text-red-500">Not configured</span>
                    )}
                  </p>
                </div>

                <Alert variant={dropboxLoaded ? 'default' : 'destructive'}>
                  {dropboxLoaded ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {dropboxLoaded ? 'Dropbox SDK Loaded' : 'Dropbox SDK Not Loaded'}
                  </AlertTitle>
                  <AlertDescription>
                    {dropboxLoaded
                      ? 'The Dropbox SDK has been loaded successfully.'
                      : 'The Dropbox SDK has not been loaded yet.'}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Settings</AlertTitle>
                <AlertDescription>Could not load cloud integration settings.</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleDropboxTest} disabled={!dropboxLoaded}>
              Test Dropbox Chooser
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
            <CardDescription>Real-time logs for debugging</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded h-[400px] overflow-y-auto font-mono text-sm">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="pb-1">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-400">No logs yet...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
