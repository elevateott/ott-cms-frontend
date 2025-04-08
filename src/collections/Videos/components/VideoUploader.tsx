'use client'

import React, { useState, useEffect } from 'react'
import MuxUploader from '@mux/mux-uploader-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@payloadcms/ui'

type VideoUploaderProps = {
  refreshList: () => void
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ refreshList }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'error'>(
    'idle',
  )
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  // Function to get upload URL from your API
  const getUploadUrl = async (file?: File) => {
    try {
      // Get the filename from the file if available
      const filename = file?.name || 'video-upload'

      const res = await fetch('/api/mux/direct-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
        credentials: 'include', // To send authentication cookies
      })

      if (!res.ok) throw new Error('Failed to create upload URL')

      const data = await res.json()
      setUploadStatus('uploading')

      return data.url
    } catch (error) {
      console.error('Error creating Mux upload:', error)
      setError('Failed to create upload URL. Please try again.')
      setUploadStatus('error')
      return null
    }
  }

  useEffect(() => {
    // Attach event handlers to the uploader
    const handleEvents = () => {
      const uploader = document.querySelector('mux-uploader')
      if (!uploader) return

      // Handle progress updates
      uploader.addEventListener('uploadprogress', function (event: Event) {
        const customEvent = event as any
        setProgress(customEvent.detail.progress)
      })

      // Handle successful upload
      uploader.addEventListener('uploadcomplete', function (event: Event) {
        const customEvent = event as any
        console.log('Upload complete event:', customEvent.detail)

        setUploadStatus('processing')

        // The webhook will handle creating the video document
        // We need to refresh the list after a delay to allow the webhook to process
        // and create the video document
        setTimeout(() => {
          console.log('Refreshing video list after upload')
          refreshList()
        }, 5000) // Increased delay to 5 seconds to give webhook more time
      })

      // Handle upload errors
      uploader.addEventListener('uploaderror', function (event: Event) {
        const customEvent = event as any
        console.error('Upload error:', customEvent.detail)
        setError(customEvent.detail.message || 'Upload failed')
        setUploadStatus('error')
      })
    }

    handleEvents()
  }, [refreshList])

  if (!user) {
    return <div>Please log in to upload videos</div>
  }

  return (
    <div className="mb-6 p-4 border rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Upload Video to Mux</h3>
        <p className="text-sm text-gray-500">
          Upload your video directly to Mux. The video will be processed and added to your library
          automatically.
        </p>
      </div>
      <div>
        {uploadStatus === 'idle' && (
          <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
            <MuxUploader
              endpoint={getUploadUrl}
              onUploadStart={(file) => {
                // The file object is available in the onUploadStart callback
                console.log('Upload started for file:', file.name)
              }}
            />
          </div>
        )}

        {uploadStatus === 'uploading' && (
          <div className="space-y-4">
            <div className="flex items-center">
              <span>Uploading video...</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${Math.round(progress)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">Upload progress: {Math.round(progress)}%</p>
          </div>
        )}

        {uploadStatus === 'processing' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="font-medium mb-2">Processing Video</div>
            <p className="text-sm">
              Your video has been uploaded and is being processed by Mux. This may take a few
              minutes depending on the video size. The video will appear in the list below when
              ready.
            </p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-medium mb-2">Upload Error</div>
            <p className="text-sm">
              {error || 'There was an error uploading your video. Please try again.'}
            </p>
            <button
              className="mt-2 px-3 py-1 text-sm border rounded-md"
              onClick={() => {
                setUploadStatus('idle')
                setError(null)
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoUploader
