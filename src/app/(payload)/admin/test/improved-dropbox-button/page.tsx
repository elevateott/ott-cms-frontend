'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import DropboxIcon from '@/components/icons/DropboxIcon'

export default function ImprovedDropboxButtonPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const appKey = 'o8wxu9m9b3o2m8d' // Hardcoded for testing
  
  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
    setIsLoading(false)
  }
  
  // Helper function to download a file from a URL
  const downloadFileFromUrl = async (url: string, fileName: string): Promise<File> => {
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Determine MIME type based on file extension
      let mimeType = 'video/mp4' // Default
      if (fileName.endsWith('.mov')) mimeType = 'video/quicktime'
      else if (fileName.endsWith('.webm')) mimeType = 'video/webm'
      else if (fileName.endsWith('.avi')) mimeType = 'video/x-msvideo'
      else if (fileName.endsWith('.mkv')) mimeType = 'video/x-matroska'
      
      // Create a File object from the blob
      return new File([blob], fileName, { type: mimeType })
    } catch (error) {
      clientLogger.error('Error downloading file', 'ImprovedDropboxButton', { error })
      throw error
    }
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Improved Dropbox Button Test</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Improved Dropbox Button</CardTitle>
            <CardDescription>Testing the improved Dropbox button with better icon and loading state</CardDescription>
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
              
              <Alert variant={selectedFile ? "default" : "destructive"}>
                {selectedFile ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {selectedFile ? "File Selected" : "No File Selected"}
                </AlertTitle>
                <AlertDescription>
                  {selectedFile 
                    ? `Selected file: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` 
                    : "Click the button below to select a file from Dropbox."}
                </AlertDescription>
              </Alert>
              
              <div className="pt-4">
                <h3 className="font-medium mb-2">Dropbox Button:</h3>
                <Button
                  id="test-dropbox-button"
                  onClick={() => {
                    setIsLoading(true)
                    clientLogger.info('Dropbox button clicked', 'ImprovedDropboxButton')
                    
                    // Create a script element for Dropbox
                    const script = document.createElement('script')
                    script.id = 'dropboxjs'
                    script.type = 'text/javascript'
                    script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
                    script.setAttribute('data-app-key', appKey)
                    
                    script.onload = () => {
                      if (window.Dropbox) {
                        window.Dropbox.choose({
                          success: (files: any) => {
                            if (files && files.length > 0) {
                              const file = files[0]
                              if (file && file.name && file.link) {
                                downloadFileFromUrl(file.link, file.name)
                                  .then((fileObj) => {
                                    handleFileSelected(fileObj)
                                  })
                                  .catch((error) => {
                                    setIsLoading(false)
                                    clientLogger.error('Error downloading file from Dropbox', 'ImprovedDropboxButton', { error })
                                    alert('Error downloading file from Dropbox. Please try again.')
                                  })
                              }
                            } else {
                              setIsLoading(false)
                            }
                          },
                          cancel: () => {
                            setIsLoading(false)
                            clientLogger.info('Dropbox selection cancelled', 'ImprovedDropboxButton')
                          },
                          linkType: 'direct',
                          multiselect: false,
                          extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
                        })
                      } else {
                        setIsLoading(false)
                      }
                    }
                    
                    script.onerror = () => {
                      setIsLoading(false)
                      clientLogger.error('Failed to load Dropbox SDK', 'ImprovedDropboxButton')
                      alert('Could not load Dropbox. Please try again later.')
                    }
                    
                    document.body.appendChild(script)
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
              This test page demonstrates the improved Dropbox button with better icon and loading state.
              The button should be enabled as soon as the page loads, and clicking it should show a loading indicator.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
