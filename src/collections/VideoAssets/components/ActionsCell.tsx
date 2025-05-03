'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash, Pencil, Loader2 } from 'lucide-react'
import './styles.css'
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

// Define the props for the ActionsCell component
type ActionsCellProps = {
  rowData: {
    id: string
    [key: string]: any
  }
}

const ActionsCell: React.FC<ActionsCellProps> = ({ rowData }) => {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false)
  const [dependencies, setDependencies] = useState<any[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  // No need for row styling with the simplified approach

  // Handle edit button click
  const handleEdit = () => {
    router.push(`/admin/collections/videoassets/${rowData.id}`)
  }

  // Handle delete button click
  const handleDelete = async () => {
    setIsDeleteDialogOpen(false)
    setIsDeleting(true)

    try {
      // Call the API to check for dependencies and delete the video asset
      const response = await fetch(`/api/videoassets/${rowData.id}/check-dependencies`, {
        method: 'GET',
      })

      const result = await response.json()

      if (response.ok) {
        if (result.dependencies && result.dependencies.length > 0) {
          // If there are dependencies, show the dependency dialog
          setDependencies(result.dependencies)
          setIsDependencyDialogOpen(true)
        } else {
          // If no dependencies, proceed with deletion
          await performDelete(false)
        }
      } else {
        clientLogger.error('Error checking dependencies:', result.error, 'ActionsCell')
        alert(`Error: ${result.error || 'Failed to check dependencies'}`)
      }
    } catch (error) {
      clientLogger.error('Error in handleDelete:', error, 'ActionsCell')
      alert('An error occurred while trying to delete the video asset')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle force delete (with dependency cleanup)
  const handleForceDelete = async () => {
    setIsDependencyDialogOpen(false)
    setIsDeleting(true)

    try {
      await performDelete(true)
    } catch (error) {
      clientLogger.error('Error in handleForceDelete:', error, 'ActionsCell')
      alert('An error occurred while trying to force delete the video asset')
    } finally {
      setIsDeleting(false)
    }
  }

  // Perform the actual deletion
  const performDelete = async (force: boolean) => {
    try {
      const endpoint = force
        ? `/api/videoassets/${rowData.id}/force-delete`
        : `/api/videoassets/${rowData.id}`

      const response = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the page to show the updated list
        window.location.reload()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete video asset')
      }
    } catch (error) {
      clientLogger.error('Error in performDelete:', error, 'ActionsCell')
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete video asset'}`)
    }
  }

  return (
    <div id={`actions-cell-${rowData.id}`} className="flex items-center space-x-2 relative">
      {isDeleting ? (
        <div className="flex items-center text-sm text-red-600 font-medium">
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          <span>Deleting...</span>
        </div>
      ) : (
        <>
          <Button size="sm" variant="outline" onClick={handleEdit} title="Edit video asset">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            title="Delete video asset"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg text-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Are you sure you want to delete this video asset?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 mt-2">
              This action cannot be undone. This will permanently delete the video asset and remove
              the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dependency Dialog */}
      <AlertDialog open={isDependencyDialogOpen} onOpenChange={setIsDependencyDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg text-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              This video asset is used in other content
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 mt-2">
              <p className="mb-2">
                This video asset is linked to {dependencies.length} content item
                {dependencies.length !== 1 ? 's' : ''}:
              </p>
              <ul className="list-disc pl-5 mb-4 max-h-40 overflow-y-auto">
                {dependencies.map((dep) => (
                  <li key={dep.id} className="text-sm">
                    {dep.title}
                  </li>
                ))}
              </ul>
              <p className="font-medium text-red-600">
                Proceeding will remove this video from all linked content. Are you sure?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Remove References & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ActionsCell
