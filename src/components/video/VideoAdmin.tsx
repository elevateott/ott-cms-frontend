'use client'

/**
 * VideoAdmin Component
 *
 * An enhanced component for managing videos in the admin panel
 */

import React, { useState, useCallback } from 'react'
import { cn } from '@/utilities/ui'
import MuxVideoUploader from './MuxVideoUploader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export type VideoAdminProps = React.HTMLAttributes<HTMLDivElement>

export const VideoAdmin: React.FC<VideoAdminProps> = ({ className, ...props }) => {
  const [sourceType, setSourceType] = useState<'mux' | 'embedded'>('mux')
  const [embeddedUrl, setEmbeddedUrl] = useState('')

  const handleEmbeddedUrlSubmit = () => {
    if (!embeddedUrl.trim()) return
    // Handle embedded URL submission here
    // This could be an API call to create a new video entry with the embedded URL
    console.log('Embedded URL submitted:', embeddedUrl)
    setEmbeddedUrl('')
  }

  return (
    <div
      className={cn('space-y-6 w-full max-w-full', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Management</h1>
      </div>

      {/* Source Type Selection */}
      <div className="space-y-4 p-6 bg-white rounded-lg border">
        <div className="space-y-2">
          <Label htmlFor="sourceType">Video Source Type</Label>
          <Select value={sourceType} onValueChange={(value: 'mux' | 'embedded') => setSourceType(value)}>
            <SelectTrigger id="sourceType" className="w-48">
              <SelectValue placeholder="Select source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mux">Mux Upload</SelectItem>
              <SelectItem value="embedded">Embedded URL</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Upload a video file directly to Mux, or switch to Embedded URL to use an existing HLS stream.
          </p>
        </div>

        {/* Mux Uploader */}
        {sourceType === 'mux' && (
          <MuxVideoUploader
            endpoint={async (file?: File) => {
              if (!file) return '' // Return empty string if no file provided

              const response = await fetch('/api/mux/direct-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.name }),
              })

              const result = await response.json()

              if (!result.data?.url) {
                throw new Error('Invalid upload URL response')
              }

              return result.data.url // Return the URL string directly
            }}
          />
        )}

        {/* Embedded URL Input */}
        {sourceType === 'embedded' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="embeddedUrl">HLS Stream URL</Label>
              <Input
                id="embeddedUrl"
                type="url"
                placeholder="Enter HLS stream URL"
                value={embeddedUrl}
                onChange={(e) => setEmbeddedUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleEmbeddedUrlSubmit}>Add Embedded Video</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoAdmin




