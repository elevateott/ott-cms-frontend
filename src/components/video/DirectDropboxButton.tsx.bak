'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import DropboxIcon from '@/components/icons/DropboxIcon'
import { clientLogger } from '@/utils/clientLogger'

interface DirectDropboxButtonProps {
  appKey: string
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export function DirectDropboxButton({ appKey, onFileSelected, disabled = false }: DirectDropboxButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Handle Dropbox file selection
  const handleDropboxSelect = () => {
    if (disabled) return
    
    setIsLoading(true)
    
    // Log the current state for debugging
    console.log('Dropbox button clicked', { appKey })
    
    // If Dropbox isn't loaded yet, try to load it
    if (!window.Dropbox) {
      clientLogger.warn('Dropbox SDK not loaded, attempting to load it now', 'DirectDropboxButton')
      
      // Create a new script element
      const script = document.createElement('script')
      script.id = 'dropboxjs'
      script.type = 'text/javascript'
      script.src = 'https://www.dropbox.com/static/api/2/dropins.js'
      script.setAttribute('data-app-key', appKey)
      
      script.onload = () => {
        console.log('Dropbox SDK loaded successfully on button click')
        
        // Wait a moment for Dropbox to initialize
        setTimeout(() => {
          if (window.Dropbox) {
            openDropboxChooser()
          } else {
            setIsLoading(false)
            alert('Could not initialize Dropbox. Please try again later.')
          }
        }, 500)
      }
      
      script.onerror = () => {
        console.error('Failed to load Dropbox SDK on button click')
        setIsLoading(false)
        alert('Could not load Dropbox. Please try again later.')
      }
      
      document.body.appendChild(script)
      return
    }

    openDropboxChooser()
  }

  // Open the Dropbox chooser
  const openDropboxChooser = () => {
    try {
      // Double-check that Dropbox is available
      if (!window.Dropbox) {
        console.error('Dropbox object not available when trying to open chooser')
        setIsLoading(false)
        alert('Could not initialize Dropbox. Please try again later.')
        return
      }
      
      window.Dropbox.choose({
        success: (files: Array<{ name: string; link?: string; bytes?: number }>) => {
          setIsLoading(false)
          
          if (files && files.length > 0) {
            const file = files[0]
            if (file && file.name && file.link) {
              downloadFileFromUrl(file.link, file.name)
                .then((fileObj) => {
                  onFileSelected(fileObj)
                })
                .catch((error) => {
                  clientLogger.error('Error downloading file from Dropbox', 'DirectDropboxButton', {
                    error,
                  })
                  alert('Error downloading file from Dropbox. Please try again.')
                })
            } else {
              clientLogger.error('Invalid file object from Dropbox', 'DirectDropboxButton')
              alert('Invalid file selected. Please try again.')
            }
          }
        },
        cancel: () => {
          setIsLoading(false)
          clientLogger.info('Dropbox selection cancelled', 'DirectDropboxButton')
        },
        linkType: 'direct',
        multiselect: false,
        extensions: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
      })
    } catch (error) {
      setIsLoading(false)
      clientLogger.error('Error initializing Dropbox chooser', 'DirectDropboxButton', { error })
      alert('There was an error initializing the Dropbox chooser. Please try again later.')
    }
  }

  // Helper function to download a file from a URL
  const downloadFileFromUrl = async (url: string, fileName: string): Promise<File> => {
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`)
      }
      
      const blob = await response.blob()
      
      // Determine MIME type based on file extension
      let mimeType = 'video/mp4' // Default
      if (fileName.endsWith('.mov')) mimeType = 'video/quicktime'
      else if (fileName.endsWith('.webm')) mimeType = 'video/webm'
      else if (fileName.endsWith('.avi')) mimeType = 'video/x-msvideo'
      else if (fileName.endsWith('.mkv')) mimeType = 'video/x-matroska'
      
      // Create a File object from the blob
      return new File([blob], fileName, { type: mimeType })
    } catch (error) {
      clientLogger.error('Error downloading file', 'DirectDropboxButton', { error })
      throw error
    }
  }

  return (
    <Button
      onClick={handleDropboxSelect}
      disabled={disabled || !appKey}
      variant="outline"
      className={isLoading ? 'opacity-70' : ''}
    >
      <DropboxIcon className="mr-2 h-4 w-4" />
      Choose from Dropbox
      {isLoading && <span className="ml-2 text-xs">(loading...)</span>}
    </Button>
  )
}
