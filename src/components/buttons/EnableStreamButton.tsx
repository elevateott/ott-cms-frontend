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

const logger = clientLogger.createContextLogger('EnableStreamButton')

export const EnableStreamButton: React.FC = () => {
  const { id, document } = useDocumentInfo()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Check if the button should be disabled
  const isDisabled = !document?.muxLiveStreamId || 
                     document?.muxStatus !== 'disabled'

  const handleEnable = async () => {
    try {
      setIsLoading(true)
      logger.info(`Enabling live stream for document ${id}`)

      const response = await fetch(`/api/live-events/${id}/enable-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to enable live stream')
      }

      // Show success toast
      toast({
        title: 'Stream Enabled',
        description: 'The live stream has been successfully enabled.',
        duration: 3000,
      })

      // Reload the page to reflect the changes
      window.location.reload()
    } catch (error) {
      logger.error('Error enabling live stream:', error)
      
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
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 disabled:bg-gray-100"
      >
        {isLoading ? 'Enabling...' : 'Enable Stream'}
      </Button>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-enable the live stream. The stream will be broadcastable again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEnable}
              className="bg-green-500 hover:bg-green-600"
            >
              Enable Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default EnableStreamButton
