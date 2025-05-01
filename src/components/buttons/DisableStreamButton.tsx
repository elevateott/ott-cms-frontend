'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from 'payload/components/forms'
import { useToast } from '@/components/ui/use-toast'
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

const logger = clientLogger.createContextLogger('DisableStreamButton')

export const DisableStreamButton: React.FC = () => {
  const { id, document } = useDocumentInfo()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Check if the button should be disabled
  const isDisabled = !document?.muxLiveStreamId || 
                     document?.muxStatus === 'disabled' || 
                     document?.muxStatus === null

  const handleDisable = async () => {
    try {
      setIsLoading(true)
      logger.info(`Disabling live stream for document ${id}`)

      const response = await fetch(`/api/live-events/${id}/disable-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to disable live stream')
      }

      // Show success toast
      toast({
        title: 'Stream Disabled',
        description: 'The live stream has been successfully disabled.',
        duration: 3000,
      })

      // Reload the page to reflect the changes
      window.location.reload()
    } catch (error) {
      logger.error('Error disabling live stream:', error)
      
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
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsConfirmOpen(true)}
        disabled={isDisabled || isLoading}
        className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 disabled:bg-gray-100"
      >
        {isLoading ? 'Disabling...' : 'Disable Stream'}
      </Button>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will temporarily disable the live stream. The stream will no longer be broadcastable, 
              but all metadata will be preserved. You can re-enable it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Disable Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default DisableStreamButton
