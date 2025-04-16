/**
 * Utility to directly update the status in the list view
 * This is a workaround for when the React state updates don't trigger a re-render
 */

/**
 * Find all status cells in the list view and update them if they match the given video ID
 */
export const updateStatusInListView = (videoId: string, newStatus: string): boolean => {
  console.log(`🔍 DEBUG [directStatusUpdate] Attempting to update status for video ${videoId} to ${newStatus}`)
  
  try {
    // Find all links in the list view that might contain the video ID
    const videoLinks = document.querySelectorAll('a[href*="/admin/collections/videos/"]')
    console.log(`🔍 DEBUG [directStatusUpdate] Found ${videoLinks.length} video links in the list view`)
    
    let updated = false
    
    // Check each link to see if it contains our video ID
    videoLinks.forEach(link => {
      const href = link.getAttribute('href')
      if (href && href.includes(videoId)) {
        console.log(`🔍 DEBUG [directStatusUpdate] Found link for video ${videoId}: ${href}`)
        
        // Find the row that contains this link
        const row = link.closest('tr')
        if (row) {
          console.log(`🔍 DEBUG [directStatusUpdate] Found row for video ${videoId}`)
          
          // Find all cells in this row
          const cells = row.querySelectorAll('td')
          cells.forEach((cell, index) => {
            // Look for a cell that might contain status information
            const cellText = cell.textContent?.toLowerCase() || ''
            if (
              cellText.includes('uploading') || 
              cellText.includes('processing') || 
              cellText.includes('ready') || 
              cellText.includes('error')
            ) {
              console.log(`🔍 DEBUG [directStatusUpdate] Found status cell at index ${index} with text: ${cellText}`)
              
              // Create a new status badge based on the new status
              let badgeHTML = ''
              switch (newStatus.toLowerCase()) {
                case 'ready':
                  badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Ready</span>`
                  break
                case 'processing':
                  badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Processing</span>`
                  break
                case 'uploading':
                  badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Uploading</span>`
                  break
                case 'error':
                  badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Error</span>`
                  break
                default:
                  badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">${newStatus}</span>`
              }
              
              // Update the cell content
              cell.innerHTML = badgeHTML
              console.log(`🔍 DEBUG [directStatusUpdate] Updated status cell for video ${videoId} to ${newStatus}`)
              updated = true
            }
          })
        }
      }
    })
    
    return updated
  } catch (error) {
    console.error(`🔍 DEBUG [directStatusUpdate] Error updating status in list view:`, error)
    return false
  }
}
