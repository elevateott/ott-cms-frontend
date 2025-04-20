'use client'

import React, { useEffect } from 'react'

const HideCreateButton: React.FC = () => {
  useEffect(() => {
    // Function to hide the "Create New" button
    const hideCreateButton = () => {
      // Find the "Create New" button by its text content
      const buttons = document.querySelectorAll('button')
      for (const button of buttons) {
        if (button.textContent?.includes('Create New')) {
          // Hide the button
          button.style.display = 'none'
          console.log('Hid the "Create New" button')
          break
        }
      }
    }

    // Run once on mount
    hideCreateButton()

    // Also set up a MutationObserver to handle dynamic changes
    const observer = new MutationObserver((mutations) => {
      hideCreateButton()
    })

    // Start observing the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Clean up
    return () => {
      observer.disconnect()
    }
  }, [])

  // This component doesn't render anything
  return null
}

export default HideCreateButton
