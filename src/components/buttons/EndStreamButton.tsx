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

const logger = clientLogger.createContextLogger('EndStreamButton')

export const EndStreamButton: React.FC = () => {
  const { id, document } = useDocumentInfo()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Check if the button should be disabled
  // Only allow "End Stream" action if the current status is Active or Disconnected
  const isDisabled =
    !document?.muxLiveStreamId || !['active', 'disconnected'].includes(document?.muxStatus)

  const handleEndStream = async () => {
    try {
      setIsLoading(true)
      logger.info('Ending live stream:', id)

      const response = await fetch(`/api/live-events/${id}/end-stream`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to end live stream')
      }

      // Show success toast
      toast({
        title: 'Success',
        description: 'Live stream successfully ended.',
        duration: 5000,
      })

      // Reload the page to reflect the changes
      window.location.reload()
    } catch (error) {
      logger.error('Error ending live stream:', error)

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
        className="bg-black border-gray-800 text-white hover:bg-gray-800 hover:text-white disabled:bg-gray-100"
      >
        {isLoading ? 'Ending...' : 'End Stream'}
      </Button>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end the live stream? This action cannot be undone.
              <br />
              <br />
              This will signal to Mux that the stream is complete, which will:
              <ul className="list-disc pl-5 mt-2">
                <li>Finalize any recording</li>
                <li>Create VOD assets immediately</li>
                <li>Prevent further streaming with the current stream key</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndStream} className="bg-black hover:bg-gray-800">
              End Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default EndStreamButton
