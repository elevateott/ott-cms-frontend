'use client'

import React, { useEffect } from 'react'

/**
 * This component injects styles for the Mux Uploader component
 * to ensure immediate styling and prevent the default blue button
 * from appearing temporarily.
 */
export const MuxUploaderStyles: React.FC = () => {
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style')
    styleEl.setAttribute('id', 'mux-uploader-immediate-styles')

    // Add the CSS content
    styleEl.textContent = `
      /* Ensure immediate styling for Mux Uploader button */
      mux-uploader button,
      .mux-uploader button {
        margin-top: 0.5rem !important;
        padding: 0.5rem 1rem !important;
        background-color: rgb(37, 99, 235) !important; /* bg-blue-600 */
        color: white !important;
        border-radius: 0.375rem !important; /* rounded-md */
        transition-property: background-color !important;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
        transition-duration: 150ms !important;
        font-family: inherit !important;
        font-size: 0.875rem !important;
        line-height: 1.25rem !important;
        font-weight: 500 !important;
      }

      mux-uploader button:hover,
      .mux-uploader button:hover {
        background-color: rgb(29, 78, 216) !important; /* bg-blue-700 */
      }

      /* Hide the default button until our styles are applied */
      mux-uploader:not(.styled) button {
        visibility: hidden !important;
      }

      /* Show buttons only after our class is applied */
      mux-uploader.styled button {
        visibility: visible !important;
      }
    `

    // Append to head with high priority
    document.head.insertBefore(styleEl, document.head.firstChild)

    // Apply the class to any existing mux-uploader elements
    const uploaders = document.querySelectorAll('mux-uploader')
    uploaders.forEach((uploader) => {
      uploader.classList.add('styled')
    })

    // Create a mutation observer to watch for mux-uploader elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach((node) => {
            // Check if the added node is an element and has the tag name 'mux-uploader'
            if (node.nodeType === 1) {
              if ((node as Element).tagName?.toLowerCase() === 'mux-uploader') {
                ;(node as Element).classList.add('styled')
              }

              // Also check children
              const childUploaders = (node as Element).querySelectorAll?.('mux-uploader')
              if (childUploaders) {
                childUploaders.forEach((uploader) => {
                  uploader.classList.add('styled')
                })
              }
            }
          })
        }
      })
    })

    // Start observing the document
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    // Clean up on unmount
    return () => {
      observer.disconnect()
      const existingStyle = document.getElementById('mux-uploader-immediate-styles')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}

export default MuxUploaderStyles
