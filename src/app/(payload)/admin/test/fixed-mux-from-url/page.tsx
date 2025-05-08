'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import DropboxIcon from '@/components/icons/DropboxIcon'

export default function FixedMuxFromUrlPage() {
  const [selectedFile, setSelectedFile] = useState<{ name: string; url: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [assetInfo, setAssetInfo] = useState<any>(null)
  const appKey = 'o8wxu9m9b3o2m8d' // Hardcoded for testing
  
  const handleFileSelected = (file: { name: string; url: string }) => {
    setSelectedFile(file)
    setIsLoading(false)
    setUploadStatus('success')
    
    // Log file details
    clientLogger.info('File selected', 'FixedMuxFromUrl', {
      name: file.name,
      url: file.url.substring(0, 50) + '...' // Truncate URL for logging
    })
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Fixed Mux From URL Test</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Mux Asset From URL</CardTitle>
            <CardDescription>Testing creating a Mux asset directly from a Dropbox URL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Dropbox App Key:</h3>
                <p className="font-mono bg-gray-100 p-2 rounded">
                  {appKey ? (
                    <>
                      {appKey.substring(0, 4)}...
                      <span className="text-gray-500 text-xs ml-2">
                        (Length: {appKey.length})
                      </span>
                    </>
                  ) : (
                    <span className="text-red-500">Not configured</span>
                  )}
                </p>
              </div>
              
              <Alert variant={uploadStatus === 'success' ? "default" : uploadStatus === 'error' ? "destructive" : "warning"}>
                {uploadStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {uploadStatus === 'idle' && "No File Selected"}
                  {uploadStatus === 'creating' && "Creating Mux Asset"}
                  {uploadStatus === 'success' && "Asset Created"}
                  {uploadStatus === 'error' && "Error"}
                </AlertTitle>
                <AlertDescription>
                  {uploadStatus === 'idle' && "Click the button below to select a file from Dropbox."}
                  {uploadStatus === 'creating' && "Creating Mux asset from URL..."}
                  {uploadStatus === 'success' && selectedFile && `Selected file: ${selectedFile.name}`}
                  {uploadStatus === 'error' && errorMessage}
                </AlertDescription>
              </Alert>
              
              {assetInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="font-medium mb-2">Mux Asset Information:</h3>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(assetInfo, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="pt-4">
                <h3 className="font-medium mb-2">Dropbox Button:</h3>
                <Button
                  id="test-dropbox-button"
                  onClick={async () => {
                    try {
                      setIsLoading(true)
                      clientLogger.info('Dropbox button clicked', 'FixedMuxFromUrl')
                      
                      // Create a script element for Dropbox
                      const script = document.createElement('script')
                      script.id = 'dropboxjs'
                      script.type = 'text/javascript'
                      script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
                      script.setAttribute('data-app-key', appKey)
                      
                      // Wait for the script to load
                      await new Promise<void>((resolve, reject) => {
                        script.onload = () => resolve()
                        script.onerror = () => reject(new Error('Failed to load Dropbox SDK'))
                        document.body.appendChild(script)
                      })
                      
                      // Make sure Dropbox is available
                      if (!window.Dropbox) {
                        throw new Error('Dropbox SDK not available after loading')
                      }
                      
                      // Choose a file from Dropbox
                      const dropboxFile = await new Promise<{name: string; link: string}>((resolve, reject) => {
                        window.Dropbox.choose({
                          success: (files: any) => {
                            if (files && files.length > 0) {
                              const file = files[0]
                              if (file && file.name && file.link) {
                                resolve(file)
                              } else {
                                reject(new Error('Invalid file object from Dropbox'))
                              }
                            } else {
                              reject(new Error('No files selected from Dropbox'))
                            }
                          },
                          cancel: () => {
                            reject(new Error('Dropbox selection cancelled'))
                          },
                          linkType: 'direct',
                          multiselect: false,
                          extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
                        })
                      })
                      
                      // Create Mux asset from URL
                      setUploadStatus('creating')
                      clientLogger.info('Creating Mux asset from URL', 'FixedMuxFromUrl', {
                        url: dropboxFile.link.substring(0, 50) + '...',
                        filename: dropboxFile.name
                      })
                      
                      const response = await fetch('/api/mux/create-from-url', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          url: dropboxFile.link,
                          filename: dropboxFile.name,
                        }),
                      })
                      
                      if (!response.ok) {
                        let errorMessage = response.statusText
                        try {
                          const errorData = await response.json()
                          errorMessage = errorData.error || response.statusText
                        } catch (_parseError) {
                          // If we can't parse the response as JSON, use the status text
                          clientLogger.error('Error parsing error response', 'FixedMuxFromUrl', { 
                            status: response.status,
                            statusText: response.statusText
                          })
                        }
                        throw new Error(`Failed to create Mux asset: ${errorMessage}`)
                      }
                      
                      let result
                      try {
                        result = await response.json()
                      } catch (_parseError) {
                        clientLogger.error('Error parsing success response', 'FixedMuxFromUrl')
                        throw new Error('Failed to parse response from server')
                      }
                      
                      clientLogger.info('Mux asset created successfully', 'FixedMuxFromUrl', {
                        assetId: result.data.asset.id,
                        playbackId: result.data.asset.playbackId,
                        status: result.data.asset.status,
                      })
                      
                      setAssetInfo(result.data)
                      handleFileSelected({
                        name: dropboxFile.name,
                        url: dropboxFile.link
                      })
                      setUploadStatus('success')
                    } catch (error) {
                      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                      
                      // Don't show error for cancelled selection
                      if (errorMsg === 'Dropbox selection cancelled') {
                        setUploadStatus('idle')
                      } else {
                        setUploadStatus('error')
                        setErrorMessage(errorMsg)
                        clientLogger.error('Error in Dropbox upload process', 'FixedMuxFromUrl', { 
                          error: errorMsg,
                          stack: error instanceof Error ? error.stack : 'No stack trace'
                        })
                      }
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  variant="outline"
                  disabled={isLoading}
                  className={isLoading ? 'opacity-70' : ''}
                >
                  <DropboxIcon className="mr-2 h-4 w-4" />
                  Choose from Dropbox
                  {isLoading && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="text-xs mr-1">(loading...)</span>
                      <span className="animate-spin">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 3"></path>
                        </svg>
                      </span>
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-gray-500">
              This test page demonstrates creating a Mux asset directly from a Dropbox URL.
              This is more efficient than downloading the file and then uploading it to Mux.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
