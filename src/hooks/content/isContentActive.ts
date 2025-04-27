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
    content.isPublished === true &&
    (!content.publishAt || new Date(content.publishAt) <= now) &&
    (!content.unpublishAt || new Date(content.unpublishAt) > now)
  )
}
