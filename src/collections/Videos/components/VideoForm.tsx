'use client'

import React, { useEffect, useState } from 'react'
import MuxUploader from '@mux/mux-uploader-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type VideoFormProps = {
  value?: any
  path: string
  onChange: (val: any) => void
}

const VideoForm: React.FC<VideoFormProps> = ({ value = {}, onChange }) => {
  const [sourceType, setSourceType] = useState(value?.sourceType || 'Mux')

  // Update form field when sourceType changes
  useEffect(() => {
    onChange({
      ...value,
      sourceType,
    })
  }, [sourceType])

  // Attach uploadcomplete event
  useEffect(() => {
    const uploader = document.querySelector('mux-uploader')
    if (!uploader) return

    const handleUploadComplete = (e: any) => {
      const { upload_id, asset_id, playback_ids } = e.detail

      onChange({
        ...value,
        muxAsset: {
          uploadID: upload_id,
          assetID: asset_id,
          playbackID: playback_ids?.[0]?.id,
        },
      })
    }

    uploader.addEventListener('uploadcomplete', handleUploadComplete)

    return () => {
      uploader.removeEventListener('uploadcomplete', handleUploadComplete)
    }
  }, [value])

  // Fetch upload URL from your backend
  const handleMuxUpload = async (): Promise<string> => {
    const res = await fetch('/api/mux/direct-upload-url')
    const { url, uploadID } = await res.json()

    onChange({
      ...value,
      muxAsset: {
        ...value?.muxAsset,
        uploadID,
      },
    })

    return url
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-xl shadow border">
      {/* Source Type Select */}
      <div className="space-y-2">
        <Label htmlFor="sourceType">Video Source Type</Label>
        <Select value={sourceType} onValueChange={setSourceType}>
          <SelectTrigger>
            <SelectValue placeholder="Select source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Mux">Mux</SelectItem>
            <SelectItem value="Embedded">Embedded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mux Upload */}
      {sourceType === 'Mux' && (
        <div className="space-y-2">
          <Label>Mux Video Uploader</Label>
          <MuxUploader endpoint={handleMuxUpload} />
        </div>
      )}

      {/* Embedded URL */}
      {sourceType === 'Embedded' && (
        <div className="space-y-2">
          <Label htmlFor="embeddedUrl">Embedded HLS URL</Label>
          <Input
            id="embeddedUrl"
            value={value?.embeddedUrl || ''}
            onChange={(e) =>
              onChange({
                ...value,
                embeddedUrl: e.target.value,
              })
            }
            placeholder="https://example.com/video.m3u8"
          />
        </div>
      )}
    </div>
  )
}

export default VideoForm
