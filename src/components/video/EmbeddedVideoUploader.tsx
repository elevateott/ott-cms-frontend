'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { eventBus } from '@/utilities/eventBus'
import { EVENTS } from '@/constants/events'
import { clientLogger } from '@/utils/clientLogger'
import { Loader2, AlertCircle } from 'lucide-react'
import HLS from 'hls-parser'
import { VideoAssetRepository } from '@/repositories/videoAssetRepository'

interface EmbeddedVideoUploaderProps {
  onUploadComplete?: (data: { id: string; title: string; embeddedUrl: string }) => void
}

const EmbeddedVideoUploader: React.FC<EmbeddedVideoUploaderProps> = ({ onUploadComplete }) => {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'validating' | 'valid' | 'invalid'
  >('idle')

  const validateUrl = async (url: string): Promise<boolean> => {
    if (!url.trim()) {
      setError('URL is required')
      return false
    }

    if (!url.endsWith('.m3u8')) {
      setError('URL must be an HLS .m3u8 stream')
      return false
    }

    try {
      setValidationStatus('validating')
      // Try to fetch the manifest to validate it
      const response = await fetch('/api/validate-hls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to validate HLS manifest')
        setValidationStatus('invalid')
        return false
      }

      setValidationStatus('valid')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      clientLogger.error('Error validating HLS URL', 'EmbeddedVideoUploader', {
        error: errorMessage,
      })
      setError('Failed to validate HLS manifest. Please check the URL and try again.')
      setValidationStatus('invalid')
      return false
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')

      // Validate the URL
      const isValid = await validateUrl(url)
      if (!isValid) {
        setLoading(false)
        return
      }

      // Create the video asset
      const response = await fetch('/api/videoassets/create-embedded', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || url.split('/').pop()?.split('.')[0] || 'Untitled Video',
          embeddedUrl: url,
          sourceType: 'embedded',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create video asset')
      }

      const result = await response.json()
      clientLogger.info('Embedded video asset created', 'EmbeddedVideoUploader', { result })

      // Emit client-side event for upload completed - match the pattern in MuxVideoUploader
      const eventData = {
        assetId: result.id,
        embeddedUrl: result.embeddedUrl,
        title: result.title,
        timestamp: Date.now(),
        source: 'embedded',
      }

      // Log the event emission
      clientLogger.info('Emitting VIDEO_UPLOAD_COMPLETED event', 'EmbeddedVideoUploader', {
        eventType: EVENTS.VIDEO_UPLOAD_COMPLETED,
        eventData,
      })

      // Emit using the constant from EVENTS
      eventBus.emit(EVENTS.VIDEO_UPLOAD_COMPLETED, eventData)

      // Also emit with underscore format for compatibility (as done in MuxVideoUploader)
      eventBus.emit('video_upload_completed', eventData)

      // Emit REFRESH_LIST_VIEW event (as done in VideoUploader)
      eventBus.emit('REFRESH_LIST_VIEW', {
        source: 'embedded-uploader',
        action: 'upload_complete',
        timestamp: Date.now(),
      })

      // Call onUploadComplete callback if provided
      if (onUploadComplete) {
        onUploadComplete({
          id: result.id,
          title: result.title,
          embeddedUrl: result.embeddedUrl,
        })
      }

      // Reset form
      setUrl('')
      setTitle('')
      setValidationStatus('idle')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      clientLogger.error('Error creating embedded video asset', 'EmbeddedVideoUploader', {
        error: errorMessage,
      })
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hlsUrl">HLS Stream URL</Label>
        <Input
          id="hlsUrl"
          value={url}
          placeholder="https://example.com/stream.m3u8"
          onChange={(e) => {
            setUrl(e.target.value)
            setValidationStatus('idle')
            setError('')
          }}
          className={validationStatus === 'valid' ? 'border-green-500' : ''}
          disabled={loading}
        />
        {validationStatus === 'valid' && (
          <p className="text-green-600 text-sm">URL validated successfully</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-gray-500 text-sm">(optional)</span>
        </Label>
        <Input
          id="title"
          value={title}
          placeholder="My Video Title"
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        <p className="text-gray-500 text-sm">
          If left empty, the title will be extracted from the URL or manifest
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        className="w-full flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Processing...' : 'Add Embedded Video'}
      </Button>
    </div>
  )
}

export default EmbeddedVideoUploader
