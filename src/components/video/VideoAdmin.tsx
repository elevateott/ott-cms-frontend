'use client'

import { clientLogger } from '@/utils/clientLogger'

/**
 * VideoAdmin Component
 *
 * An enhanced component for managing videos in the admin panel
 */

import React, { useState, useEffect } from 'react'
import { cn } from '@/utilities/ui'
import MuxVideoUploader from './MuxVideoUploader'
import MuxUploaderStyles from './MuxUploaderStyles'
import Script from 'next/script'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export type VideoAdminProps = React.HTMLAttributes<HTMLDivElement>

/**
 * DeleteAllVideos Component
 *
 * A component that provides a button to delete all videos in the system
 */
const DeleteAllVideos: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { toast } = useToast()

  const handleDeleteAllVideos = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      setSuccess(false)

      // Call the API to delete all video assets
      const response = await fetch('/api/videoassets/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete video assets')
      }

      const result = await response.json()
      setSuccess(true)
      clientLogger.info('All video assets deleted successfully:', result, 'videoVideoAdmin')

      // Show success toast
      toast({
        title: 'Success',
        description: `Successfully deleted ${result.deletedCount} video assets`,
        variant: 'default',
      })

      // Close the dialog after a short delay
      setTimeout(() => {
        setIsOpen(false)
        // Reload the page to reflect changes
        window.location.reload()
      }, 1500)
    } catch (err) {
      clientLogger.error('Error deleting videos:', err, 'videoVideoAdmin')
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)

      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Video Assets
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white border border-gray-200 shadow-lg text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete All Video Assets
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              This action will permanently delete ALL video assets from the system. This cannot be
              undone. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              All video assets have been successfully deleted.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllVideos}
              disabled={isDeleting}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete All Video Assets'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * DeleteAllMuxVideos Component
 *
 * A component that provides a button to delete all videos in Mux
 */
const DeleteAllMuxVideos: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const { toast } = useToast()

  const handleDeleteAllMuxVideos = async () => {
    try {
      setIsDeleting(true)
      setError(null)
      setSuccess(false)
      setProgress(null)

      // Call the API to delete all Mux videos
      const response = await fetch('/api/mux/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete Mux videos')
      }

      const result = await response.json()
      setSuccess(true)
      setProgress({ current: result.count, total: result.totalCount })
      clientLogger.info('All Mux videos deleted successfully:', result, 'videoVideoAdmin')

      // Show success toast with detailed information
      toast({
        title: 'Success',
        description: `Successfully deleted ${result.count} Mux videos${result.failedCount ? `, failed to delete ${result.failedCount}` : ''}`,
        variant: 'default',
      })

      // Close the dialog after a short delay
      setTimeout(() => {
        setIsOpen(false)
      }, 1500)
    } catch (err) {
      clientLogger.error('Error deleting Mux videos:', err, 'videoVideoAdmin')
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)

      // Show error toast
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mt-6">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Mux Videos
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white border border-gray-200 shadow-lg text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete All Mux Videos
            </DialogTitle>
            <DialogDescription className="text-gray-700 mt-2">
              This action will permanently delete ALL videos from Mux. This cannot be undone. Note:
              This will not delete videos from the CMS database. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="font-medium">Mux videos deletion complete.</p>
              {progress && (
                <p className="text-sm mt-1">
                  Successfully deleted {progress.current} of {progress.total} videos.
                  {progress.current < progress.total && (
                    <span className="text-yellow-600">
                      {' '}
                      Failed to delete {progress.total - progress.current} videos.
                    </span>
                  )}
                </p>
              )}
              <p className="text-sm mt-1">Check the browser console for detailed logs.</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllMuxVideos}
              disabled={isDeleting}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting
                ? progress
                  ? `Deleting... (${progress.current}/${progress.total})`
                  : 'Deleting...'
                : 'Delete All Mux Videos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const VideoAdmin: React.FC<VideoAdminProps> = ({ className, ...props }) => {
  const [sourceType, setSourceType] = useState<'mux' | 'embedded'>('mux')
  const [embeddedUrl, setEmbeddedUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Set loading to false after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // 1.5 second delay

    return () => clearTimeout(timer)
  }, [])

  const handleEmbeddedUrlSubmit = () => {
    if (!embeddedUrl.trim()) return
    // Handle embedded URL submission here
    // This could be an API call to create a new video entry with the embedded URL
    clientLogger.info('Embedded URL submitted:', embeddedUrl, 'videoVideoAdmin')
    setEmbeddedUrl('')
  }

  return (
    <div className={cn('space-y-6 w-full max-w-full', className)} {...props}>
      {/* Add the styles component */}
      <MuxUploaderStyles />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Management</h1>
        <div className="flex space-x-2">
          <DeleteAllVideos />
          <DeleteAllMuxVideos />
        </div>
      </div>

      {/* Source Type Selection */}
      <div className="space-y-4 p-6 bg-white rounded-lg border">
        <div className="space-y-2">
          <Label htmlFor="sourceType">Video Source Type</Label>
          <Select
            value={sourceType}
            onValueChange={(value: 'mux' | 'embedded') => setSourceType(value)}
          >
            <SelectTrigger id="sourceType" className="w-48">
              <SelectValue placeholder="Select source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mux">Mux Upload</SelectItem>
              <SelectItem value="embedded">Embedded URL</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Upload a video file directly to Mux, or switch to Embedded URL to use an existing HLS
            stream.
          </p>
        </div>

        {/* Mux Uploader */}
        {sourceType === 'mux' && (
          <>
            {/* Load preload script with highest priority */}
            <Script
              id="mux-uploader-preload-admin"
              strategy="afterInteractive"
              src="/mux-uploader-preload.js"
              onLoad={() => {
                clientLogger.info(
                  'Mux Uploader preload script loaded in VideoAdmin',
                  'videoVideoAdmin',
                )
              }}
            />
            {isLoading ? (
              // Show loader while uploader is not ready
              <div className="w-full h-48 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Loading video uploader...</p>
              </div>
            ) : (
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
          </>
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
