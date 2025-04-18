import React, { useState } from 'react'
import { cn } from '@/utilities/ui'
import { Card } from '@/components/ui/card'
import { useEventBusEmit } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'
import { API_ROUTES } from '@/constants/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import ClientVideoUploader from './ClientVideoUploader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface VideoUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onUploadComplete?: (data: { uploadId?: string; assetId?: string; embeddedUrl?: string }) => void
  onUploadError?: (error: Error) => void
  refreshList?: () => void
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  className,
  onUploadComplete,
  onUploadError,
  refreshList,
  ...props
}) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'error'>(
    'idle',
  )
  const [sourceType, setSourceType] = useState<'mux' | 'embedded'>('mux')
  const [embeddedUrl, setEmbeddedUrl] = useState('')
  const emitEvent = useEventBusEmit()

  // Function to get upload URL from your API
  const getUploadUrl = async (file: File): Promise<string | null> => {
    try {
      console.log('VideoUploader.getUploadUrl called with file:', file.name, 'size:', file.size)
      const filename = file.name

      // First create the upload URL
      console.log('Fetching upload URL from', API_ROUTES.MUX_DIRECT_UPLOAD)
      const response = await fetch(API_ROUTES.MUX_DIRECT_UPLOAD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
        credentials: 'include',
      })

      if (!response.ok) {
        console.error('Failed to get upload URL, status:', response.status)
        throw new Error(`Failed to get upload URL: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Upload URL response:', data)

      if (!data.data?.url || !data.data?.uploadId) {
        console.error('Invalid response from server:', data)
        throw new Error('Invalid response from server')
      }

      // Create a video document with the uploadId
      try {
        const createRes = await fetch(API_ROUTES.MUX_CREATE_VIDEO, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uploadId: data.data.uploadId,
            filename: filename,
          }),
          credentials: 'include',
        })

        if (!createRes.ok) {
          throw new Error('Failed to create video document')
        }

        const createData = await createRes.json()
        console.log('Video document created:', createData)

        // Emit video created event
        console.log('Emitting VIDEO_CREATED event with data:', {
          id: createData.id,
          uploadId: data.data.uploadId,
        })

        emitEvent(EVENTS.VIDEO_CREATED, {
          id: createData.id,
          uploadId: data.data.uploadId,
        })

        // Also emit the event with the colon format for consistency
        emitEvent('video:created', {
          id: createData.id,
          uploadId: data.data.uploadId,
        })

        // Emit the REFRESH_LIST_VIEW event to refresh the list view
        console.log('Emitting REFRESH_LIST_VIEW event for new video')
        emitEvent('REFRESH_LIST_VIEW', {
          source: 'uploader',
          action: 'video_created',
          videoId: createData.id,
        })

        // Also emit refresh:list:view for consistency
        emitEvent('refresh:list:view', {
          source: 'uploader',
          action: 'video_created',
          videoId: createData.id,
        })
      } catch (createError) {
        console.error('Error creating video document:', createError)
        throw createError
      }

      return data.data.url
    } catch (error) {
      console.error('Error in getUploadUrl:', error)
      handleError(error as Error)
      return null
    }
  }

  const handleError = (error: Error) => {
    setUploadStatus('error')
    if (onUploadError) {
      onUploadError(error)
    }
    emitEvent(EVENTS.NOTIFICATION, {
      type: 'error',
      title: 'Upload Failed',
      message: error.message,
    })
  }

  const handleSuccess = (event: CustomEvent) => {
    // Extract data from the event
    const data = event.detail || {}
    console.log('handleSuccess called with data:', data)

    setUploadStatus('processing')

    if (onUploadComplete) {
      console.log('Calling onUploadComplete with data:', data)
      onUploadComplete(data)
    }

    emitEvent(EVENTS.NOTIFICATION, {
      type: 'success',
      title: 'Upload Complete',
      message: 'Video has been uploaded and is now processing.',
    })

    // Emit video updated event if we have an ID
    if (data.id) {
      console.log('Emitting video_updated event with data:', data)
      emitEvent(EVENTS.VIDEO_UPDATED, {
        id: data.id,
        isStatusChange: false,
      })

      // Also emit the event with the colon format for consistency
      emitEvent('video:updated', {
        id: data.id,
        isStatusChange: false,
      })
    }

    // Emit REFRESH_LIST_VIEW event
    console.log('Emitting REFRESH_LIST_VIEW event')
    emitEvent('REFRESH_LIST_VIEW', {
      source: 'uploader',
      action: 'upload_complete',
      timestamp: Date.now(),
    })

    if (refreshList) {
      console.log('Calling refreshList after 2 seconds')
      setTimeout(() => {
        console.log('Refreshing list now')
        refreshList()

        // Call it again after a longer delay
        setTimeout(() => {
          console.log('Refreshing list again')
          refreshList()
        }, 3000)
      }, 2000)
    }
  }

  // Handle embedded URL submission
  const handleEmbeddedUrlSubmit = () => {
    if (!embeddedUrl) {
      handleError(new Error('Please enter a valid URL'))
      return
    }

    // Here you would typically create a video document with the embedded URL
    // For now, just show a success message
    if (onUploadComplete) {
      onUploadComplete({ embeddedUrl })
    }

    // Show notification
    emitEvent(EVENTS.NOTIFICATION, {
      type: 'success',
      title: 'URL Added',
      message: 'Embedded video URL has been added.',
    })

    if (refreshList) {
      setTimeout(refreshList, 2000)
    }
  }

  return (
    <div className={cn('', className)} {...props}>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Video</h2>

        {/* Source Type Info */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Upload a video file directly to Mux, or switch to Embedded URL to use an existing HLS
            stream.
          </p>
          <div className="flex items-center mt-2">
            <Label htmlFor="sourceType" className="mr-2 font-medium">
              Source Type:
            </Label>
            <Select
              value={sourceType}
              onValueChange={(value) => setSourceType(value as 'mux' | 'embedded')}
            >
              <SelectTrigger id="sourceType" className="w-48">
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mux">Mux Upload</SelectItem>
                <SelectItem value="embedded">Embedded URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mux Uploader */}
        {sourceType === 'mux' && (
          <ClientVideoUploader
            endpoint={(file?: File) => {
              console.log('ClientVideoUploader endpoint called with file:', file?.name)
              return file
                ? getUploadUrl(file).then((url) => {
                    console.log('Got upload URL:', url)
                    return url || ''
                  })
                : Promise.resolve('')
            }}
            onUploadComplete={(data) => {
              console.log('ClientVideoUploader onUploadComplete called with data:', data)
              handleSuccess({
                detail: {
                  upload_id: data.uploadId,
                  asset_id: data.assetId,
                  playback_ids: data.playbackId ? [{ id: data.playbackId }] : undefined,
                },
              } as unknown as CustomEvent)
            }}
            onUploadError={(error) => {
              console.error('ClientVideoUploader onUploadError called with error:', error)
              handleError(error)
            }}
          />
        )}

        {/* Embedded URL Input */}
        {sourceType === 'embedded' && (
          <div className="space-y-4 p-4 border border-border rounded-lg bg-card/50">
            <div>
              <Label htmlFor="embeddedUrl" className="block mb-2 font-medium">
                Embedded Video URL
              </Label>
              <Input
                id="embeddedUrl"
                type="url"
                placeholder="https://example.com/video.m3u8"
                value={embeddedUrl}
                onChange={(e) => setEmbeddedUrl(e.target.value)}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the URL for your embedded HLS video stream (e.g., .m3u8 file)
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground italic">
                Note: Embedded videos must be properly formatted HLS streams
              </p>
              <Button onClick={handleEmbeddedUrlSubmit}>Add Embedded Video</Button>
            </div>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-medium mb-2">Upload Error</div>
            <p className="text-sm">There was an error uploading your video. Please try again.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setUploadStatus('idle')
              }}
            >
              Try Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default VideoUploader
