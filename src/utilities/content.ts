/**
 * Utility functions for content
 */

/**
 * Check if content is active based on its publishing window
 * 
 * @param content The content object to check
 * @returns True if the content is active, false otherwise
 */
export const isContentActive = (content: any): boolean => {
  if (!content) return false
  
  const now = new Date()
  
  return (
    content.status === 'published' &&
    (!content.publishAt || new Date(content.publishAt) <= now) &&
    (!content.unpublishAt || new Date(content.unpublishAt) > now)
  )
}

/**
 * Filter an array of content items to only include active ones
 * 
 * @param contentItems Array of content items to filter
 * @returns Array of active content items
 */
export const filterActiveContent = (contentItems: any[]): any[] => {
  if (!contentItems || !Array.isArray(contentItems)) return []
  
  return contentItems.filter(isContentActive)
}
