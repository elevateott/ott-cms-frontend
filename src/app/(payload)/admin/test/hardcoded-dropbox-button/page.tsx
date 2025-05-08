'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'

export default function HardcodedDropboxButtonPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const appKey = 'o8wxu9m9b3o2m8d' // Hardcoded for testing
  
  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
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
      clientLogger.error('Error downloading file', 'HardcodedDropboxButton', { error })
      throw error
    }
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Hardcoded Dropbox Button Test</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hardcoded Dropbox Button</CardTitle>
            <CardDescription>Testing the hardcoded Dropbox button implementation</CardDescription>
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
                  onClick={() => {
                    clientLogger.info('Dropbox button clicked', 'HardcodedDropboxButton')
                    
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
                                    clientLogger.error('Error downloading file from Dropbox', 'HardcodedDropboxButton', { error })
                                    alert('Error downloading file from Dropbox. Please try again.')
                                  })
                              }
                            }
                          },
                          cancel: () => {
                            clientLogger.info('Dropbox selection cancelled', 'HardcodedDropboxButton')
                          },
                          linkType: 'direct',
                          multiselect: false,
                          extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
                        })
                      }
                    }
                    
                    document.body.appendChild(script)
                  }}
                  variant="outline"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill="currentColor"
                      d="M163.2 148.6l75.5 62.9-75.5 62.9-75.5-62.9 75.5-62.9zm163.1 0l75.5 62.9-75.5 62.9-75.5-62.9 75.5-62.9zm-85.5 88.3l75.5 62.9-75.5 62.9-75.5-62.9 75.5-62.9z"
                    />
                  </svg>
                  Choose from Dropbox
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-gray-500">
              This test page demonstrates the hardcoded Dropbox button implementation.
              The button should be enabled as soon as the page loads, and clicking it should open the Dropbox chooser.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
