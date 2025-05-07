'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function DropboxFixPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [dropboxLoaded, setDropboxLoaded] = useState(false)
  const [appKey, setAppKey] = useState<string>('o8wxu9m9b3o2m8d') // Hardcoded for testing

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`])
  }

  // Load Dropbox SDK directly with hardcoded key
  const loadDropboxSDK = () => {
    addLog('Loading Dropbox SDK with hardcoded key')
    
    // Remove any existing script
    const existingScript = document.getElementById('dropboxjs')
    if (existingScript) {
      addLog('Removing existing Dropbox script')
      document.head.removeChild(existingScript)
    }
    
    // Create script exactly as shown in Dropbox documentation
    const script = document.createElement('script')
    script.id = 'dropboxjs'
    script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
    script.type = 'text/javascript'
    script.setAttribute('data-app-key', appKey)
    
    addLog(`Created script with id=${script.id}, data-app-key=${script.getAttribute('data-app-key')}`)
    
    script.onload = () => {
      addLog('Script loaded')
      if (window.Dropbox) {
        addLog('Dropbox object is available')
        setDropboxLoaded(true)
      } else {
        addLog('ERROR: Dropbox object not available after script load')
      }
    }
    
    script.onerror = (e) => {
      addLog(`ERROR: Failed to load script: ${e}`)
    }
    
    // Append to document body
    document.body.appendChild(script)
    addLog('Script appended to document body')
  }
  
  // Test Dropbox chooser
  const testDropbox = () => {
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
  
  // Inline script approach
  const inlineScriptApproach = () => {
    addLog('Using inline script approach')
    
    // Create a script element with the content
    const script = document.createElement('script')
    script.textContent = `
      if (typeof Dropbox === 'undefined') {
        console.log('Dropbox not defined yet');
      }
      
      // Define a global callback function
      window.dropboxLoaded = function() {
        console.log('Dropbox loaded via callback');
        document.dispatchEvent(new Event('dropbox-loaded'));
      };
    `
    document.head.appendChild(script)
    
    // Now add the Dropbox script
    const dropboxScript = document.createElement('script')
    dropboxScript.id = 'dropboxjs'
    dropboxScript.src = 'https://www.dropbox.com/static/api/2/dropins.js'
    dropboxScript.type = 'text/javascript'
    dropboxScript.setAttribute('data-app-key', appKey)
    document.head.appendChild(dropboxScript)
    
    // Listen for the custom event
    document.addEventListener('dropbox-loaded', () => {
      addLog('Dropbox loaded event received')
      setDropboxLoaded(true)
    })
    
    addLog('Inline script approach completed')
  }
  
  // Direct script tag approach
  const directScriptTagApproach = () => {
    addLog('Using direct script tag approach')
    
    // Create the HTML string
    const htmlString = `
      <script type="text/javascript" src="https://www.dropbox.com/static/api/2/dropins.js" id="dropboxjs" data-app-key="${appKey}"></script>
    `
    
    // Create a temporary container
    const container = document.createElement('div')
    container.innerHTML = htmlString
    
    // Get the script element
    const script = container.firstChild as HTMLScriptElement
    
    // Append it to the document
    document.head.appendChild(script)
    
    addLog('Direct script tag approach completed')
    
    // Check if Dropbox is available after a short delay
    setTimeout(() => {
      if (window.Dropbox) {
        addLog('Dropbox object is available after direct script tag approach')
        setDropboxLoaded(true)
      } else {
        addLog('ERROR: Dropbox object not available after direct script tag approach')
      }
    }, 1000)
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Dropbox Fix Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dropbox SDK Test</CardTitle>
            <CardDescription>Test different approaches to loading the Dropbox SDK</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant={dropboxLoaded ? "default" : "destructive"}>
                {dropboxLoaded ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {dropboxLoaded ? "Dropbox SDK Loaded" : "Dropbox SDK Not Loaded"}
                </AlertTitle>
                <AlertDescription>
                  {dropboxLoaded 
                    ? "The Dropbox SDK has been loaded successfully." 
                    : "The Dropbox SDK has not been loaded yet."}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p className="text-sm">App Key: <code>{appKey}</code></p>
                <div className="flex flex-col space-y-2">
                  <Button onClick={loadDropboxSDK} variant="outline">
                    Load Dropbox SDK (Dynamic Script)
                  </Button>
                  <Button onClick={inlineScriptApproach} variant="outline">
                    Load Dropbox SDK (Inline Script)
                  </Button>
                  <Button onClick={directScriptTagApproach} variant="outline">
                    Load Dropbox SDK (Direct Script Tag)
                  </Button>
                  <Button 
                    onClick={testDropbox} 
                    disabled={!dropboxLoaded}
                    variant="default"
                  >
                    Test Dropbox Chooser
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
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
