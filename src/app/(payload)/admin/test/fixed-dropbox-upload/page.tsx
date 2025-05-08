'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clientLogger } from '@/utils/clientLogger'
import DropboxIcon from '@/components/icons/DropboxIcon'
// Implement fetchWithTimeout directly in the test page
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 10000,
): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export default function FixedDropboxUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'downloading' | 'uploading' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const appKey = 'o8wxu9m9b3o2m8d' // Hardcoded for testing

  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
    setIsLoading(false)
    setUploadStatus('success')

    // Log file details
    clientLogger.info('File selected', 'FixedDropboxUpload', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
    })
  }

  // Helper function to download a file from a URL
  const downloadFileFromUrl = async (url: string, fileName: string): Promise<File> => {
    try {
      setUploadStatus('downloading')
      clientLogger.info('Starting file download', 'FixedDropboxUpload', { url, fileName })

      // Simple fetch without timeout for testing
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })

      if (!response.ok) {
        const errorMsg = `Failed to download file: ${response.status} ${response.statusText}`
        clientLogger.error(errorMsg, 'FixedDropboxUpload')
        throw new Error(errorMsg)
      }

      clientLogger.info('Response received, getting blob', 'FixedDropboxUpload')
      const blob = await response.blob()

      clientLogger.info('Blob received', 'FixedDropboxUpload', {
        blobSize: blob.size,
        blobType: blob.type,
      })

      if (blob.size === 0) {
        const errorMsg = 'Downloaded file is empty (0 bytes)'
        clientLogger.error(errorMsg, 'FixedDropboxUpload')
        throw new Error(errorMsg)
      }

      // Determine MIME type based on file extension
      let mimeType = 'video/mp4' // Default
      if (fileName.endsWith('.mov')) mimeType = 'video/quicktime'
      else if (fileName.endsWith('.webm')) mimeType = 'video/webm'
      else if (fileName.endsWith('.avi')) mimeType = 'video/x-msvideo'
      else if (fileName.endsWith('.mkv')) mimeType = 'video/x-matroska'

      clientLogger.info('Creating File object', 'FixedDropboxUpload', { mimeType })

      // Create a File object from the blob with a lastModified date
      const file = new File([blob], fileName, {
        type: mimeType,
        lastModified: Date.now(),
      })

      // Verify the file was created correctly
      if (file.size === 0) {
        const errorMsg = 'Created File object is empty (0 bytes)'
        clientLogger.error(errorMsg, 'FixedDropboxUpload')
        throw new Error(errorMsg)
      }

      clientLogger.info('File downloaded successfully', 'FixedDropboxUpload', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
      })

      return file
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error downloading file'
      setUploadStatus('error')
      setErrorMessage(errorMsg)
      clientLogger.error('Error downloading file', 'FixedDropboxUpload', {
        error: errorMsg,
        stack: error instanceof Error ? error.stack : 'No stack trace',
      })
      throw error
    }
  }

  // Simulate the Mux upload endpoint
  const simulateMuxUpload = async (file: File): Promise<void> => {
    try {
      setUploadStatus('uploading')

      // Simulate a delay for the upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Check if the file is valid
      if (!file || file.size === 0) {
        throw new Error('Invalid file object')
      }

      // Log success
      clientLogger.info('File uploaded successfully', 'FixedDropboxUpload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })

      setUploadStatus('success')
    } catch (error) {
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error uploading file')
      clientLogger.error('Error uploading file', 'FixedDropboxUpload', { error })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Fixed Dropbox Upload Test</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fixed Dropbox Upload</CardTitle>
            <CardDescription>Testing the fixed Dropbox upload implementation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Dropbox App Key:</h3>
                <p className="font-mono bg-gray-100 p-2 rounded">
                  {appKey ? (
                    <>
                      {appKey.substring(0, 4)}...
                      <span className="text-gray-500 text-xs ml-2">(Length: {appKey.length})</span>
                    </>
                  ) : (
                    <span className="text-red-500">Not configured</span>
                  )}
                </p>
              </div>

              <Alert
                variant={
                  uploadStatus === 'success'
                    ? 'default'
                    : uploadStatus === 'error'
                      ? 'destructive'
                      : 'warning'
                }
              >
                {uploadStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {uploadStatus === 'idle' && 'No File Selected'}
                  {uploadStatus === 'downloading' && 'Downloading File'}
                  {uploadStatus === 'uploading' && 'Uploading File'}
                  {uploadStatus === 'success' && 'File Selected'}
                  {uploadStatus === 'error' && 'Error'}
                </AlertTitle>
                <AlertDescription>
                  {uploadStatus === 'idle' &&
                    'Click the button below to select a file from Dropbox.'}
                  {uploadStatus === 'downloading' && 'Downloading file from Dropbox...'}
                  {uploadStatus === 'uploading' && 'Uploading file to Mux...'}
                  {uploadStatus === 'success' &&
                    selectedFile &&
                    `Selected file: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`}
                  {uploadStatus === 'error' && errorMessage}
                </AlertDescription>
              </Alert>

              <div className="pt-4">
                <h3 className="font-medium mb-2">Dropbox Button:</h3>
                <Button
                  id="test-dropbox-button"
                  onClick={() => {
                    setIsLoading(true)
                    clientLogger.info('Dropbox button clicked', 'FixedDropboxUpload')

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
                                clientLogger.info(
                                  'File selected from Dropbox',
                                  'FixedDropboxUpload',
                                  {
                                    fileName: file.name,
                                    fileSize: file.bytes || 0,
                                  },
                                )

                                downloadFileFromUrl(file.link, file.name)
                                  .then((fileObj) => {
                                    // Simulate uploading to Mux
                                    return simulateMuxUpload(fileObj).then(() => {
                                      handleFileSelected(fileObj)
                                    })
                                  })
                                  .catch((error) => {
                                    setIsLoading(false)
                                    setUploadStatus('error')
                                    setErrorMessage(
                                      error instanceof Error ? error.message : 'Unknown error',
                                    )
                                    clientLogger.error(
                                      'Error processing file from Dropbox',
                                      'FixedDropboxUpload',
                                      { error },
                                    )
                                  })
                              }
                            } else {
                              setIsLoading(false)
                              setUploadStatus('idle')
                            }
                          },
                          cancel: () => {
                            setIsLoading(false)
                            setUploadStatus('idle')
                            clientLogger.info('Dropbox selection cancelled', 'FixedDropboxUpload')
                          },
                          linkType: 'direct',
                          multiselect: false,
                          extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
                        })
                      } else {
                        setIsLoading(false)
                        setUploadStatus('error')
                        setErrorMessage('Dropbox SDK not available')
                      }
                    }

                    script.onerror = () => {
                      setIsLoading(false)
                      setUploadStatus('error')
                      setErrorMessage('Failed to load Dropbox SDK')
                      clientLogger.error('Failed to load Dropbox SDK', 'FixedDropboxUpload')
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
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="1 3"
                          ></path>
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
              This test page demonstrates the fixed Dropbox upload implementation. It simulates the
              entire process from selecting a file to uploading it to Mux.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
