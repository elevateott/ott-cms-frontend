'use client'

// src/collections/Videos/components/VideoEdit.tsx


import React, { useEffect, useState } from 'react'
import MuxUploaderField from './MuxUploaderField'

type VideoEditProps = {
  path: string
  label?: string
  value?: Record<string, unknown>
}

const VideoEdit: React.FC<VideoEditProps> = ({ path, value }) => {
  const [sourceType, setSourceType] = useState((value?.sourceType as string) || 'mux')

  // Listen for changes to the sourceType field
  useEffect(() => {
    const sourceTypeField = document.querySelector('select[name="sourceType"]')
    if (sourceTypeField) {
      sourceTypeField.addEventListener('change', (e) => {
        setSourceType((e.target as HTMLSelectElement).value)
      })
    }
  }, [])

  return (
    <div>
      {sourceType === 'mux' && (
        <MuxUploaderField path={`${path}.muxData`} label="Upload Video to Mux" />
      )}
    </div>
  )
}

export default VideoEdit
