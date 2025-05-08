'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import DropboxIcon from '@/components/icons/DropboxIcon'
import { DropboxButton } from '@/components/video/DropboxButton'

export default function DropboxButtonTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const appKey = 'o8wxu9m9b3o2m8d' // Hardcoded for testing

  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Dropbox Button Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dropbox Button Component</CardTitle>
            <CardDescription>Test the standalone Dropbox button component</CardDescription>
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
                <DropboxButton 
                  appKey={appKey} 
                  onFileSelected={handleFileSelected}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Icon Test</CardTitle>
            <CardDescription>Test the Dropbox icon component</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Dropbox Icon (Various Sizes):</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center">
                    <DropboxIcon size={16} />
                    <span className="text-xs mt-1">16px</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <DropboxIcon size={24} />
                    <span className="text-xs mt-1">24px</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <DropboxIcon size={32} />
                    <span className="text-xs mt-1">32px</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <DropboxIcon size={48} />
                    <span className="text-xs mt-1">48px</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Dropbox Icon (In Button):</h3>
                <Button variant="outline">
                  <DropboxIcon className="mr-2 h-4 w-4" />
                  Dropbox Icon in Button
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Dropbox Icon (With Colors):</h3>
                <div className="flex items-center space-x-4">
                  <DropboxIcon className="text-blue-500" size={24} />
                  <DropboxIcon className="text-green-500" size={24} />
                  <DropboxIcon className="text-red-500" size={24} />
                  <DropboxIcon className="text-purple-500" size={24} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
