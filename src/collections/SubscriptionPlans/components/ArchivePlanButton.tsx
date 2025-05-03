'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useConfig } from 'payload/components/utilities'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

const ArchivePlanButton: React.FC = () => {
  const { id, collection, getDocPreferences } = useDocumentInfo()
  const { serverURL } = useConfig()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState<boolean | null>(null)

  // Get the current document data
  React.useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`${serverURL}/api/${collection}/${id}`)
        const data = await response.json()
        setIsActive(data.isActive)
      } catch (err) {
        console.error('Error fetching document:', err)
      }
    }

    if (id) {
      fetchDocument()
    }
  }, [id, collection, serverURL])

  const toggleArchiveStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${serverURL}/api/${collection}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isActive: !isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errors?.[0]?.message || 'Failed to update plan')
      }

      // Update local state
      setIsActive(!isActive)

      // Refresh document preferences to trigger a reload
      if (getDocPreferences) {
        getDocPreferences()
      }

      // Reload the page to show updated data
      window.location.reload()
    } catch (err) {
      console.error('Error updating plan:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (isActive === null) {
    return null // Loading state
  }

  return (
    <div className="mb-4">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant={isActive ? 'destructive' : 'default'}
            size="sm"
            disabled={loading}
          >
            {isActive ? 'Archive Plan' : 'Unarchive Plan'}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? 'Archive Subscription Plan?' : 'Unarchive Subscription Plan?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? 'This will archive the plan and make it unavailable for new subscribers. Existing subscribers will not be affected.'
                : 'This will unarchive the plan and make it available for new subscribers.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={toggleArchiveStatus} disabled={loading}>
              {loading ? 'Processing...' : isActive ? 'Archive' : 'Unarchive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ArchivePlanButton
