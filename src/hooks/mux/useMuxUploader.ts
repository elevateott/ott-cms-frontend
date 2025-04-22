import { logger } from '@/utils/logger';
import { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'

export const useMuxUploader = (path: string) => {
  const { value, setValue } = useField({ path })
  const [uploadStatus, setUploadStatus] = useState((value as any)?.status || 'idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Get the upload URL from the server
  const getUploadUrl = async () => {
    try {
      const response = await fetch('/api/mux/direct-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const data = await response.json()
      setUploadStatus('uploading')

      // Update the field value with the upload ID
      setValue({
        ...(value as any),
        uploadId: data.uploadId,
        status: 'uploading',
      } as any)

      return data.url
    } catch (error) {
      logger.error({ context: 'mux' }, 'Error getting upload URL:', error)
      setError('Failed to get upload URL')
      setUploadStatus('error')
      return null
    }
  }

  useEffect(() => {
    // Attach event handlers to the uploader
    const handleEvents = () => {
      const uploader = document.querySelector('mux-uploader')
      if (!uploader) return

      // Use type assertion for custom events
      uploader.addEventListener('uploadprogress', function(event: Event) {
        const customEvent = event as any
        setProgress(customEvent.detail.progress)
      })

      // Handle successful upload
      uploader.addEventListener('uploadcomplete', function(event: Event) {
        const customEvent = event as any
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
      uploader.addEventListener('uploaderror', function(event: Event) {
        const customEvent = event as any
        logger.error({ context: 'mux' }, 'Upload error:', customEvent.detail)
        setError(customEvent.detail.message || 'Upload failed')
        setUploadStatus('error')
      })
    }

    handleEvents()
  }, [setValue, value])

  return {
    uploadStatus,
    progress,
    error,
    getUploadUrl,
    setUploadStatus,
    setError,
  }
}
