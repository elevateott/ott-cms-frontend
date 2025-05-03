'use client'

import React, { useState } from 'react'
import { useField, useDocumentInfo } from '@payloadcms/ui'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { clientLogger } from '@/utils/clientLogger'
import { useToast } from '@/hooks/use-toast'

const logger = clientLogger.createContextLogger('StreamKeyAdminOverride')

export const StreamKeyAdminOverride: React.FC = () => {
  const { value, setValue } = useField<string>({ path: 'muxStreamKey' })
  const { document } = useDocumentInfo()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState('')

  // In a real implementation, you would check user roles here
  // For now, we'll assume all users with access to the admin UI are admins
  const isAdmin = true

  if (!isAdmin) return null

  const handleStartEdit = () => {
    setTempValue(value || '')
    setIsEditing(true)
    logger.info('Started manual stream key edit')
  }

  const handleCancel = () => {
    setIsEditing(false)
    logger.info('Cancelled manual stream key edit')
  }

  const handleSave = () => {
    setValue(tempValue)
    setIsEditing(false)

    toast({
      title: 'Stream Key Updated',
      description: 'The stream key has been manually updated in Payload only.',
      duration: 3000,
    })

    logger.info('Manually updated stream key')
  }

  if (!document?.muxLiveStreamId) {
    return null
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">Manual Stream Key Override</div>
        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleStartEdit}
            className="flex items-center gap-1"
          >
            Edit Stream Key
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="Enter new stream key"
            className="font-mono"
          />

          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">
              <strong>Warning:</strong> Manual changes will NOT update Mux. This only updates the
              key in Payload. You must ensure this key matches your external broadcast settings.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" variant="default" size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          Admin-only feature: Manually edit the stream key if needed.
        </div>
      )}
    </div>
  )
}

export default StreamKeyAdminOverride
