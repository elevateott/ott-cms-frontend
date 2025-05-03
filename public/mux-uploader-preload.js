// This script will be executed immediately when loaded
;(function () {
  // Create a style element
  const styleEl = document.createElement('style')
  styleEl.id = 'mux-uploader-preload-styles'

  // Add the CSS content with !important to override any default styles
  styleEl.textContent = `
    /* Immediate styling for Mux Uploader button */
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

  // Create a mutation observer to watch for mux-uploader elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes) {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node is an element and has the tag name 'mux-uploader'
          if (node.nodeType === 1) {
            if (node.tagName.toLowerCase() === 'mux-uploader') {
              node.classList.add('styled')
            }

            // Also check children
            const uploaders = node.querySelectorAll('mux-uploader')
            uploaders.forEach((uploader) => {
              uploader.classList.add('styled')
            })
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
})()
