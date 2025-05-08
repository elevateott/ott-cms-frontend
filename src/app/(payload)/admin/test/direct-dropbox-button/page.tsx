'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { DirectDropboxButton } from '@/components/video/DirectDropboxButton'

export default function DirectDropboxButtonPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const appKey = 'o8wxu9m9b3o2m8d' // Hardcoded for testing
  
  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Direct Dropbox Button Test</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Direct Dropbox Button</CardTitle>
            <CardDescription>Testing the simplified Dropbox button implementation</CardDescription>
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
                <DirectDropboxButton 
                  appKey={appKey} 
                  onFileSelected={handleFileSelected}
                />
              </div>
              
              <div className="pt-4">
                <h3 className="font-medium mb-2">Debug Info:</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
                  {`App Key: ${appKey}
Length: ${appKey.length}
Button should be: ${appKey ? 'ENABLED' : 'DISABLED'}

Check the browser console for more detailed logs.`}
                </pre>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-gray-500">
              This test page demonstrates the simplified Dropbox button implementation.
              The button should be enabled as soon as the page loads, regardless of whether the Dropbox SDK is loaded yet.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
