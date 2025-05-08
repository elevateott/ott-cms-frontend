'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { GoogleDriveButton } from '@/components/buttons/GoogleDriveButton'

export default function GoogleDriveButtonTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [googleApiKey, setGoogleApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch cloud integration settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        clientLogger.info('Fetching cloud integration settings', 'GoogleDriveButtonTest')

        const response = await fetch('/api/cloud-integrations', {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch cloud integration settings: ${response.statusText}`)
        }

        const data = await response.json()

        // Set Google Drive credentials if available
        if (data.googleClientId) {
          setGoogleClientId(data.googleClientId)
          clientLogger.info(
            'Google Drive client ID is configured and available',
            'GoogleDriveButtonTest',
          )
        } else {
          setGoogleClientId(null)
          setError('Google Drive client ID is not configured')
          clientLogger.warn(
            'Google Drive client ID not found in cloud-integrations global',
            'GoogleDriveButtonTest',
          )
        }

        // Set Google API Key if available
        if (data.googleApiKey) {
          setGoogleApiKey(data.googleApiKey)
          clientLogger.info('Google API Key is configured and available', 'GoogleDriveButtonTest')
        } else {
          setGoogleApiKey(null)
          setError('Google API Key is not configured')
          clientLogger.warn(
            'Google API Key not found in cloud-integrations global',
            'GoogleDriveButtonTest',
          )
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        clientLogger.error('Error fetching cloud integration settings', 'GoogleDriveButtonTest', {
          error: errorMsg,
        })
        setError(`Error connecting to cloud integration settings: ${errorMsg}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleFileSelected = (file: File) => {
    clientLogger.info('File selected from Google Drive', 'GoogleDriveButtonTest', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
    setSelectedFile(file)
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Google Drive Button Test</h1>
      <p className="text-gray-500 mb-8">
        This page tests the Google Drive integration for multi-video upload.
      </p>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Google Drive Integration</CardTitle>
            <CardDescription>Test the Google Drive button component</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="p-4 bg-gray-100 rounded-md">
                  <p className="text-gray-500">Loading cloud integration settings...</p>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                  <div className="mt-2">
                    <p className="text-sm">
                      Please configure the Google Drive integration in the Cloud Integrations
                      settings.
                    </p>
                    <a
                      href="/admin/globals/cloud-integrations"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Go to Cloud Integrations Settings
                    </a>
                  </div>
                </Alert>
              ) : (
                <>
                  <div className="p-4 bg-green-50 rounded-md">
                    <p className="text-green-700">
                      <span className="font-medium">Google Drive Integration Status:</span>{' '}
                      Configured
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Client ID: {googleClientId ? '✓ Set' : '✗ Missing'}
                    </p>
                    <p className="text-sm text-green-600">
                      API Key: {googleApiKey ? '✓ Set' : '✗ Missing'}
                    </p>

                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800">
                        OAuth Configuration Requirements
                      </h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Make sure your Google OAuth client is configured correctly in the Google
                        Cloud Console:
                      </p>
                      <ul className="text-xs text-blue-700 list-disc list-inside mt-1">
                        <li>
                          Add the following as authorized JavaScript origins:
                          <code className="bg-blue-100 px-1 rounded">
                            {typeof window !== 'undefined'
                              ? window.location.origin
                              : 'http://localhost:3001'}
                          </code>
                        </li>
                        <li>
                          Add the following as authorized redirect URIs:
                          <code className="bg-blue-100 px-1 rounded">
                            {typeof window !== 'undefined'
                              ? window.location.origin
                              : 'http://localhost:3001'}
                          </code>
                        </li>
                        <li>Enable the Google Drive API and Google Picker API in your project</li>
                      </ul>
                    </div>
                  </div>

                  <Alert variant={selectedFile ? 'default' : 'destructive'}>
                    {selectedFile ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>{selectedFile ? 'File Selected' : 'No File Selected'}</AlertTitle>
                    <AlertDescription>
                      {selectedFile
                        ? `Selected file: ${selectedFile.name} (${Math.round(
                            selectedFile.size / 1024,
                          )} KB)`
                        : 'Click the button below to select a file from Google Drive.'}
                    </AlertDescription>
                  </Alert>

                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Google Drive Button:</h3>
                    {googleClientId && googleApiKey ? (
                      <GoogleDriveButton
                        clientId={googleClientId}
                        apiKey={googleApiKey}
                        onFileSelected={handleFileSelected}
                      />
                    ) : (
                      <p className="text-red-500">
                        Missing required credentials. Please configure both Client ID and API Key.
                      </p>
                    )}
                  </div>

                  {selectedFile && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                      <h3 className="font-medium mb-2">Selected File Details:</h3>
                      <p>
                        <span className="font-medium">Name:</span> {selectedFile.name}
                      </p>
                      <p>
                        <span className="font-medium">Size:</span>{' '}
                        {Math.round(selectedFile.size / 1024)} KB
                      </p>
                      <p>
                        <span className="font-medium">Type:</span> {selectedFile.type}
                      </p>
                      {(selectedFile as any).muxAssetId && (
                        <>
                          <p>
                            <span className="font-medium">Mux Asset ID:</span>{' '}
                            {(selectedFile as any).muxAssetId}
                          </p>
                          <p>
                            <span className="font-medium">Mux Playback ID:</span>{' '}
                            {(selectedFile as any).muxPlaybackId}
                          </p>
                          <p>
                            <span className="font-medium">Mux Status:</span>{' '}
                            {(selectedFile as any).muxStatus}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
