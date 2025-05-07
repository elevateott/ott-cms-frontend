'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { DropboxButton } from '@/components/video/DropboxButton'

export default function DropboxButtonFixPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [appKey, setAppKey] = useState<string>('o8wxu9m9b3o2m8d') // Hardcoded for testing
  
  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Dropbox Button Fix Test</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dropbox Button Test</CardTitle>
            <CardDescription>Testing the fixed Dropbox button component</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Dropbox App Key:</h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={appKey} 
                    onChange={(e) => setAppKey(e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                  <Button 
                    onClick={() => setAppKey('o8wxu9m9b3o2m8d')}
                    variant="outline"
                    size="sm"
                  >
                    Reset
                  </Button>
                </div>
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
                <DropboxButton 
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
              This test page demonstrates the fixed Dropbox button component.
              The button should be enabled as soon as the page loads, regardless of whether the Dropbox SDK is loaded yet.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
