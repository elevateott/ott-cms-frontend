'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash, Link, FolderPlus, Copy } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
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
import { Button } from '@/components/ui/button'

// Define the props for the QuickActionsCell component
type QuickActionsCellProps = {
  rowData: {
    id: string
    title?: string
    sourceType?: string
    muxData?: {
      playbackId?: string
    }
    embeddedUrl?: string
    [key: string]: any
  }
}

const QuickActionsCell: React.FC<QuickActionsCellProps> = ({ rowData }) => {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false)
  const [dependencies, setDependencies] = useState<any[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  // Handle edit action
  const handleEdit = () => {
    router.push(`/admin/collections/videoassets/${rowData.id}`)
  }

  // Handle copy link action
  const handleCopyLink = () => {
    try {
      // Generate the appropriate URL based on the source type
      let url = ''
      if (rowData.sourceType === 'mux' && rowData.muxData?.playbackId) {
        // Use the HLS URL format for Mux videos (better for streaming)
        url = `https://stream.mux.com/${rowData.muxData.playbackId}.m3u8`
      } else if (rowData.sourceType === 'embedded' && rowData.embeddedUrl) {
        url = rowData.embeddedUrl
      } else {
        throw new Error('No valid URL found for this video asset')
      }

      // Copy to clipboard
      navigator.clipboard.writeText(url)

      // Show toast
      setShowCopiedToast(true)
      setTimeout(() => setShowCopiedToast(false), 2000)

      clientLogger.info('Copied video URL to clipboard', 'QuickActionsCell')
    } catch (error) {
      clientLogger.error('Error copying link:', error, 'QuickActionsCell')
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to copy link'}`)
    }
  }

  // Handle move to collection action (placeholder)
  const handleMoveToCollection = () => {
    alert('Move to Collection feature is coming soon!')
  }

  // Handle delete action
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
        clientLogger.error('Error checking dependencies:', result.error, 'QuickActionsCell')
        alert(`Error: ${result.error || 'Failed to check dependencies'}`)
      }
    } catch (error) {
      clientLogger.error('Error in handleDelete:', error, 'QuickActionsCell')
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
      clientLogger.error('Error in handleForceDelete:', error, 'QuickActionsCell')
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
      clientLogger.error('Error in performDelete:', error, 'QuickActionsCell')
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete video asset'}`)
    }
  }

  return (
    <div className="relative">
      {/* Copied to clipboard toast */}
      {showCopiedToast && (
        <div className="absolute -top-8 right-0 bg-green-100 text-green-800 px-3 py-1 rounded-md shadow-md text-sm">
          Copied to clipboard!
        </div>
      )}

      {isDeleting ? (
        <div className="flex items-center text-sm text-red-600 font-medium">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Deleting...
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMoveToCollection}>
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>Create Content from Video</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy Link</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

export default QuickActionsCell
