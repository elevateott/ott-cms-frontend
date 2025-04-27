import { Access, FieldAccess } from 'payload/types'
import { User } from 'payload/auth'

/**
 * Enforces the publishing window for content
 *
 * This hook checks if the current date is within the publishAt and unpublishAt window
 * and if the content is published. It's used in the access control for the Content collection.
 */
export const enforcePublishingWindow: Access = ({ req }) => {
  // If the user is authenticated, they can see all content
  if (req.user) {
    return true
  }

  // For non-authenticated users, enforce the publishing window
  const now = new Date()

  return {
    and: [
      {
        status: {
          equals: 'published',
        },
      },
      {
        isPublished: {
          equals: true,
        },
      },
      {
        or: [
          {
            publishAt: {
              exists: false,
            },
          },
          {
            publishAt: {
              less_than_equal: now,
            },
          },
        ],
      },
      {
        or: [
          {
            unpublishAt: {
              exists: false,
            },
          },
          {
            unpublishAt: {
              greater_than: now,
            },
          },
        ],
      },
    ],
  }
}

/**
 * Helper function to check if content is active based on its publishing window
 */
export const isContentActive = (content: any): boolean => {
  const now = new Date()

  return (
    content.status === 'published' &&
    content.isPublished === true &&
    (!content.publishAt || new Date(content.publishAt) <= now) &&
    (!content.unpublishAt || new Date(content.unpublishAt) > now)
  )
}
