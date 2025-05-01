'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { Alert, AlertDescription } from '@/components/ui/alert'

const logger = clientLogger.createContextLogger('StreamKeyReveal')

export const StreamKeyReveal: React.FC = () => {
  const { document } = useDocumentInfo()
  const streamKey = document?.muxStreamKey
  const { toast } = useToast()

  const [revealed, setRevealed] = useState(false)
  const [timer, setTimer] = useState<number>(0)
  const [copied, setCopied] = useState(false)

  const handleReveal = () => {
    setRevealed(true)
    setTimer(30) // 30 second timeout
    logger.info('Stream key revealed')
  }

  const handleCopy = async () => {
    if (!streamKey) return

    try {
      await navigator.clipboard.writeText(streamKey)
      setCopied(true)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: 'Copied',
        description: 'Stream key copied to clipboard',
        duration: 2000,
      })

      logger.info('Stream key copied to clipboard')
    } catch (error) {
      logger.error('Error copying stream key to clipboard:', error)

      toast({
        title: 'Error',
        description: 'Failed to copy stream key to clipboard',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  // Timer effect for auto-hiding the stream key
  useEffect(() => {
    if (revealed && timer > 0) {
      const countdown = setTimeout(() => {
        setTimer((t) => t - 1)
      }, 1000)
      return () => clearTimeout(countdown)
    }

    if (timer === 0 && revealed) {
      setRevealed(false)
      logger.info('Stream key auto-hidden after timeout')
    }
  }, [revealed, timer])

  if (!streamKey) {
    return <div className="text-sm text-gray-500">No stream key available</div>
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">Stream Key</div>
        {!revealed && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReveal}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            <span>Reveal Key</span>
          </Button>
        )}
      </div>

      {revealed ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 w-full overflow-x-auto">
              {streamKey}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="ml-2 flex items-center gap-1"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Alert variant="warning" className="py-2">
              <AlertDescription className="text-xs">
                Never share your stream key. Anyone with this key can broadcast to your channel.
              </AlertDescription>
            </Alert>
            <div className="text-xs text-red-500 font-medium ml-2">Visible for {timer}s</div>
          </div>
        </div>
      ) : (
        <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200">
          ••••••••••••••••••••••••••••••••
        </div>
      )}
    </div>
  )
}

export default StreamKeyReveal
