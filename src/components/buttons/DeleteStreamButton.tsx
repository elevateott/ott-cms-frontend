'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { clientLogger } from '@/utils/clientLogger'

const logger = clientLogger.createContextLogger('DeleteStreamButton')

export const DeleteStreamButton: React.FC = () => {
  const { id, document } = useDocumentInfo()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDoubleConfirmOpen, setIsDoubleConfirmOpen] = useState(false)

  // Check if the button should be disabled
  const isDisabled = !document?.muxLiveStreamId || document?.muxStatus === null

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      logger.info(`Deleting live stream for document ${id}`)

      const response = await fetch(`/api/live-events/${id}/delete-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete live stream')
      }

      // Show success toast
      toast({
        title: 'Stream Deleted',
        description: 'The live stream has been permanently deleted.',
        duration: 3000,
      })

      // Reload the page to reflect the changes
      window.location.reload()
    } catch (error) {
      logger.error('Error deleting live stream:', error)

      // Show error toast
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
      setIsConfirmOpen(false)
      setIsDoubleConfirmOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsConfirmOpen(true)}
        disabled={isDisabled || isLoading}
        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 disabled:bg-gray-100"
      >
        {isLoading ? 'Deleting...' : 'Delete Stream'}
      </Button>

      {/* First confirmation dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the live stream from Mux. This action cannot be undone.
              All stream data, including stream keys and playback IDs, will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsConfirmOpen(false)
                setIsDoubleConfirmOpen(true)
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Double confirmation dialog */}
      <AlertDialog open={isDoubleConfirmOpen} onOpenChange={setIsDoubleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. The live stream will be permanently
              deleted from Mux.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Yes, Delete Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DeleteStreamButton
