import React, { useState } from 'react'
import { cn } from '@/utilities/ui'
import { Card } from '@/components/ui/card'
import MuxUploader from '@mux/mux-uploader-react'
import { useEventBusEmit } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'
import { API_ROUTES } from '@/constants/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
        emitEvent(EVENTS.VIDEO_CREATED, {
          id: createData.id,
          uploadId: data.data.uploadId,
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

    if (refreshList) {
      console.log('Calling refreshList after 2 seconds')
      setTimeout(() => {
        console.log('Refreshing list now')
        refreshList()
      }, 2000)
    }
  }

  // Handle embedded URL submission
  const handleEmbeddedSubmit = () => {
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

        {/* Source Type Selector */}
        <div className="mb-6">
          <Label htmlFor="sourceType" className="block mb-2 font-medium">
            Video Source Type
          </Label>
          <Select
            value={sourceType}
            onValueChange={(value) => setSourceType(value as 'mux' | 'embedded')}
          >
            <SelectTrigger id="sourceType" className="w-full">
              <SelectValue placeholder="Select source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mux">
                Mux Upload{' '}
                <span className="text-xs text-muted-foreground ml-1">
                  (Upload video files directly)
                </span>
              </SelectItem>
              <SelectItem value="embedded">
                Embedded URL{' '}
                <span className="text-xs text-muted-foreground ml-1">
                  (Use existing HLS stream)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mux Uploader */}
        {sourceType === 'mux' && (
          <div className="p-4 border border-border rounded-lg bg-card/50">
            <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center mb-2">
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
                }}
                onProgress={(event) => {
                  // Cast the native event to access the detail property
                  const evt = event as unknown as CustomEvent<number>
                  const progressValue = evt.detail * 100
                  console.log('MuxUploader onProgress:', progressValue.toFixed(2) + '%')
                }}
                onSuccess={(event) => {
                  console.log('MuxUploader onSuccess called with event:', event)
                  handleSuccess(event as CustomEvent)
                }}
                onError={(event) => {
                  console.error('MuxUploader onError called with event:', event)
                  handleError(
                    new Error('Upload failed: ' + (event as any)?.message || 'Unknown error'),
                  )
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground italic text-center">
              Drag and drop your video file here, or click to browse
            </p>
          </div>
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
              <Button onClick={handleEmbeddedSubmit}>Add Embedded Video</Button>
            </div>
          </div>
        )}

        {uploadStatus === 'processing' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="font-medium mb-2">Processing Video</div>
            <p className="text-sm">
              Your video has been uploaded and is being processed. This may take a few minutes
              depending on the size. The video will appear in your library when ready.
            </p>
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
