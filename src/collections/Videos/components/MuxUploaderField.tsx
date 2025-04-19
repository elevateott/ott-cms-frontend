// src/collections/Videos/components/MuxUploaderField.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import MuxUploader from '@mux/mux-uploader-react'
import { API_ROUTES } from '@/constants/api'

interface MuxUploaderFieldProps {
  path?: string
  label?: string
  required?: boolean
}

const MuxUploaderField: React.FC<MuxUploaderFieldProps> = ({ path, label }) => {
  const fieldPath = path || 'muxData'
  const { value, setValue } = useField({ path: fieldPath })
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'processing' | 'ready' | 'error'
  >((value as any)?.status || 'idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Log component mounting and current value
  useEffect(() => {
    console.log('MuxUploaderField mounted with value:', value)
    return () => {
      console.log('MuxUploaderField unmounted')
    }
  }, [])

  // Log value changes
  useEffect(() => {
    console.log('MuxUploaderField value changed:', value)
  }, [value])

  const getUploadUrl = async (file?: File) => {
    try {
      console.log('Getting upload URL for file:', file?.name, 'size:', file?.size)
      const res = await fetch(API_ROUTES.MUX_DIRECT_UPLOAD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: file?.name }),
        credentials: 'include',
      })

      if (!res.ok) {
        console.error('Failed to create upload URL, status:', res.status)
        throw new Error(`Failed to create upload URL: ${res.status} ${res.statusText}`)
      }

      const data = await res.json()
      console.log('Upload URL response:', data)

      if (!data.data?.url || !data.data?.uploadId) {
        console.error('Invalid response from server:', data)
        throw new Error('Invalid response from server')
      }

      // Update the muxData field
      console.log('Setting value with uploadId:', data.data.uploadId)
      setValue({
        ...(value as any),
        uploadId: data.data.uploadId,
        status: 'uploading',
      })

      return data.data.url
    } catch (error) {
      console.error('Error creating Mux upload:', error)
      setError('Failed to create upload URL')
      setUploadStatus('error')
      return null
    }
  }

  return (
    <div className="mb-6 p-4 border rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-medium">{label || 'Upload Video'}</h3>
        <p className="text-sm text-gray-500">Upload your video directly to Mux</p>
      </div>

      {uploadStatus === 'idle' && (
        <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
          <MuxUploader
            endpoint={(file?: File | undefined) => {
              console.log('MuxUploader endpoint called with file:', file?.name)
              return file
                ? getUploadUrl(file).then((url) => {
                    console.log('Got upload URL:', url)
                    return url || ''
                  })
                : Promise.resolve('')
            }}
            onUploadStart={() => {
              console.log('MuxUploader onUploadStart called')
              setUploadStatus('uploading')
              setProgress(0)
            }}
            onProgress={(event) => {
              // Cast the native event to access the detail property
              const evt = event as unknown as CustomEvent<number>
              const progressValue = evt.detail * 100
              console.log('MuxUploader onProgress:', progressValue.toFixed(2) + '%')
              setProgress(progressValue)
            }}
            onSuccess={(event) => {
              // Cast the native event to access the detail property
              const evt = event as unknown as CustomEvent<
                | {
                    asset_id: string
                    playback_ids?: Array<{ id: string }>
                  }
                | null
                | undefined
              >

              console.log('MuxUploader onSuccess called with event:', evt)

              if (evt.detail) {
                console.log('Upload success:', evt.detail)
                console.log('Setting value with assetId:', evt.detail.asset_id)
                setValue({
                  ...(value as any),
                  status: 'processing',
                  assetId: evt.detail.asset_id,
                  playbackId: evt.detail.playback_ids?.[0]?.id,
                })
                setUploadStatus('processing')
              } else {
                console.error('Upload success event missing detail')
              }
            }}
            onError={(event) => {
              // Cast the event appropriately
              console.error('MuxUploader onError called with event:', event)
              const error = event as unknown as Error
              console.error('Upload error:', error)
              setError(error.message || 'Unknown error')
              setUploadStatus('error')
            }}
          />
        </div>
      )}

      {uploadStatus === 'uploading' && (
        <div className="w-full">
          <div className="h-2 bg-blue-500 rounded" style={{ width: `${progress}%` }} />
          <p className="mt-2 text-sm text-gray-600">Uploading: {Math.round(progress)}%</p>
        </div>
      )}

      {uploadStatus === 'processing' && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">Processing video...</p>
          <p className="text-xs text-gray-500 mt-2">
            This may take a few minutes depending on the video size.
          </p>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="text-center py-4 text-red-500">
          <p>{error || 'An error occurred during upload'}</p>
          <button
            className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
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
  )
}

export default MuxUploaderField
