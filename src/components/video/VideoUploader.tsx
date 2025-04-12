import React, { useState, useCallback } from 'react'
import { cn } from '@/utilities/ui'
import { Card } from '@/components/ui/card'
import MuxUploader from '@mux/mux-uploader-react'
import { useEventBusEmit } from '@/hooks/useEventBus'
import { EVENTS } from '@/utilities/eventBus'
import { API_ROUTES } from '@/constants/api'

export interface VideoUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onUploadComplete?: (data: any) => void
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
  const emitEvent = useEventBusEmit()

  // Function to get upload URL from your API
  const getUploadUrl = async (file: File): Promise<string | null> => {
    try {
      const filename = file.name

      // First create the upload URL
      const response = await fetch(API_ROUTES.MUX_DIRECT_UPLOAD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const data = await response.json()

      if (!data.data?.url || !data.data?.uploadId) {
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

  const handleSuccess = (data: any) => {
    setUploadStatus('processing')
    if (onUploadComplete) {
      onUploadComplete(data)
    }
    emitEvent(EVENTS.NOTIFICATION, {
      type: 'success',
      title: 'Upload Complete',
      message: 'Video has been uploaded and is now processing.',
    })
    if (refreshList) {
      setTimeout(refreshList, 2000)
    }
  }

  return (
    <div className={cn('', className)} {...props}>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Video</h2>

        <div className="w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
          <MuxUploader
            endpoint={(file?: File | undefined) =>
              file ? getUploadUrl(file).then((url) => url || '') : Promise.resolve('')
            }
            onUploadStart={() => {
              setUploadStatus('uploading')
            }}
            onSuccess={handleSuccess}
            onError={(event) => handleError(new Error('Upload failed'))}
          />
        </div>

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
            <button
              className="mt-2 px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
              onClick={() => {
                setUploadStatus('idle')
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default VideoUploader
