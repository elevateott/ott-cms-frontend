// src/collections/Videos/components/MuxUploaderField.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import MuxUploader from '@mux/mux-uploader-react'

// Import types from src/types.d.ts
interface UploadProgressEvent extends CustomEvent {
  detail: {
    progress: number
  }
}

interface UploadCompleteEvent extends CustomEvent {
  detail: {
    upload_id: string
    asset_id: string
    playback_ids: Array<{ id: string }>
  }
}

interface UploadErrorEvent extends CustomEvent {
  detail: {
    message: string
  }
}

type MuxUploaderFieldProps = {
  path?: string
  label?: string
  required?: boolean
  _path?: string
}

const MuxUploaderField: React.FC<MuxUploaderFieldProps> = ({ _path, label }) => {
  // For the Videos collection, we need to use 'muxData' as the path
  const fieldPath = 'muxData'
  const { value, setValue } = useField({ path: fieldPath })
  const [uploadStatus, setUploadStatus] = useState((value as any)?.status || 'idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Function to get upload URL from your API
  const getUploadUrl = async () => {
    try {
      const res = await fetch('/api/mux/direct-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // To send authentication cookies
      })

      if (!res.ok) throw new Error('Failed to create upload URL')

      const data = await res.json()

      // Update the muxData.uploadId field
      setValue({
        ...(value as any),
        uploadId: data.uploadId,
        status: 'uploading',
      } as any)

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
      // Use type assertion for custom events
      uploader.addEventListener('uploadprogress', function (event: Event) {
        const customEvent = event as unknown as UploadProgressEvent
        setProgress(customEvent.detail.progress)
      })

      // Handle successful upload
      uploader.addEventListener('uploadcomplete', function (event: Event) {
        const customEvent = event as unknown as UploadCompleteEvent
        const { upload_id, asset_id, playback_ids } = customEvent.detail

        setValue({
          ...(value as any),
          uploadId: upload_id,
          assetId: asset_id,
          playbackId: playback_ids?.[0]?.id,
          status: 'processing',
        } as any)

        setUploadStatus('processing')
      })

      // Handle upload errors
      uploader.addEventListener('uploaderror', function (event: Event) {
        const customEvent = event as unknown as UploadErrorEvent
        console.error('Upload error:', customEvent.detail)
        setError(customEvent.detail.message || 'Upload failed')
        setUploadStatus('error')
      })
    }

    handleEvents()
  }, [value, setValue])

  return (
    <div className="mb-6 p-4 border rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-medium">{label || 'Upload Video'}</h3>
        <p className="text-sm text-gray-500">Upload your video directly to Mux</p>
      </div>
      <div>
        {uploadStatus === 'idle' && (
          <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
            <MuxUploader endpoint={getUploadUrl} />
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
              minutes depending on the video size. You can save this form and come back later.
            </p>
          </div>
        )}

        {uploadStatus === 'ready' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="font-medium mb-2">Video Ready</div>
            <p className="text-sm">Your video has been processed and is ready to stream.</p>
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

        {/* Add a hidden input to store the Mux data */}
        <input type="hidden" value={JSON.stringify(value || {})} name={fieldPath} />
      </div>
    </div>
  )
}

export default MuxUploaderField
