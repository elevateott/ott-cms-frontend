// src/collections/Videos/components/MuxUploaderField.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import MuxUploader from '@mux/mux-uploader-react'

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

  const getUploadUrl = async (file?: File) => {
    try {
      console.log('Getting upload URL for file:', file?.name)
      const res = await fetch('/api/mux/direct-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: file?.name }),
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Failed to create upload URL')

      const data = await res.json()

      // Update the muxData field
      setValue({
        ...(value as any),
        uploadId: data.uploadId,
        status: 'uploading',
      })

      return data.url
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
            endpoint={getUploadUrl}
            onUploadStart={() => {
              setUploadStatus('uploading')
              setProgress(0)
            }}
            onProgress={(event) => {
              // Cast the native event to access the detail property
              const evt = event as unknown as CustomEvent<number>
              setProgress(evt.detail * 100)
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

              if (evt.detail) {
                console.log('Upload success:', evt.detail)
                setValue({
                  ...(value as any),
                  status: 'processing',
                  assetId: evt.detail.asset_id,
                  playbackId: evt.detail.playback_ids?.[0]?.id,
                })
                setUploadStatus('processing')
              }
            }}
            onError={(event) => {
              // Cast the event appropriately
              const error = event as unknown as Error
              console.error('Upload error:', error)
              setError(error.message)
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
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="text-center py-4 text-red-500">
          <p>{error || 'An error occurred during upload'}</p>
        </div>
      )}
    </div>
  )
}

export default MuxUploaderField
