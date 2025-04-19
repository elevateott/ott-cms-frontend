'use client'

import React from 'react'
import MuxUploader from '@mux/mux-uploader-react'
import { useMuxUploader } from '@/hooks/mux/useMuxUploader'

type MuxUploadFieldProps = {
  path: string
  label?: string
}

const MuxUploadField: React.FC<MuxUploadFieldProps> = ({ path, label }) => {
  const { uploadStatus, progress, error, getUploadUrl, setUploadStatus, setError } =
    useMuxUploader('muxData')

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
      </div>
    </div>
  )
}

export default MuxUploadField
