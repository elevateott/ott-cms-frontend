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
import { CheckIcon, CopyIcon } from 'lucide-react'

const logger = clientLogger.createContextLogger('ResetStreamKeyButton')

export const ResetStreamKeyButton: React.FC = () => {
  const { id, document } = useDocumentInfo()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [oldStreamKey, setOldStreamKey] = useState<string | null>(null)
  const [newStreamKey, setNewStreamKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Check if the button should be disabled
  const isDisabled = !document?.muxLiveStreamId || ['disabled', null].includes(document?.muxStatus)

  const handleReset = async () => {
    try {
      setIsLoading(true)
      logger.info('Resetting stream key for live event:', id)

      const response = await fetch(`/api/live-events/${id}/reset-stream-key`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to reset stream key')
      }

      const data = await response.json()

      // Store the old and new stream keys
      setOldStreamKey(document?.muxStreamKey || '')
      setNewStreamKey(data.streamKey)

      // Copy the new stream key to clipboard
      await navigator.clipboard.writeText(data.streamKey)
      setCopied(true)

      // Show success toast
      toast({
        title: 'Success',
        description: 'Stream key reset successfully and copied to clipboard',
        duration: 5000,
      })

      // Reload the page to reflect the changes
      window.location.reload()
    } catch (error) {
      logger.error('Error resetting stream key:', error)

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

  const copyToClipboard = async () => {
    if (newStreamKey) {
      try {
        await navigator.clipboard.writeText(newStreamKey)
        setCopied(true)

        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000)

        toast({
          title: 'Copied',
          description: 'Stream key copied to clipboard',
          duration: 2000,
        })
      } catch (error) {
        logger.error('Error copying to clipboard:', error)

        toast({
          title: 'Error',
          description: 'Failed to copy to clipboard',
          variant: 'destructive',
          duration: 3000,
        })
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsConfirmOpen(true)}
        disabled={isDisabled || isLoading}
        className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800 disabled:bg-gray-100"
      >
        {isLoading ? 'Resetting...' : 'Reset Stream Key'}
      </Button>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Stream Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the current stream key and generate a new one. You will need to
              update your streaming software with the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-purple-500 hover:bg-purple-600">
              Reset Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {oldStreamKey && newStreamKey && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="text-sm font-medium mb-2">Stream Key Updated</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Old Key:</span> {oldStreamKey}
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-1">New Key:</span> {newStreamKey}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 w-6 p-0"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ResetStreamKeyButton
