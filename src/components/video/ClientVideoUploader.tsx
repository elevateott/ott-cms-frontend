'use client'

import React, { useState, useEffect } from 'react'
import SimpleVideoUploader from './SimpleVideoUploader'

interface ClientVideoUploaderProps {
  endpoint: (file?: File) => Promise<string>
  onUploadComplete?: (data: { uploadId?: string; assetId?: string; playbackId?: string }) => void
  onUploadError?: (error: Error) => void
  className?: string
}

const ClientVideoUploader: React.FC<ClientVideoUploaderProps> = (props) => {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    console.log('ClientVideoUploader mounted')
  }, [])

  if (!isMounted) {
    return (
      <div className="w-full h-48 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center">
        <p className="text-sm text-gray-500 text-center">Loading video uploader...</p>
      </div>
    )
  }

  return <SimpleVideoUploader {...props} />
}

export default ClientVideoUploader
