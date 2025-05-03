import { CollectionBeforeChangeHook } from 'payload/types'

/**
 * Hook to update content status based on the publishing window
 *
 * This hook runs before a content item is changed and updates the status
 * based on the publishAt and unpublishAt dates.
 */
export const updateContentStatus: CollectionBeforeChangeHook = ({ data, operation }) => {
  // Only run this hook for create and update operations
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  const now = new Date()
  const publishAt = data.publishAt ? new Date(data.publishAt) : null
  const unpublishAt = data.unpublishAt ? new Date(data.unpublishAt) : null

  // If the content is published and has a publishAt date in the future,
  // add a note to the admin UI
  if (data.status === 'published' && data.isPublished === true && publishAt && publishAt > now) {
    data._scheduledPublishing = `This content will be published on ${publishAt.toLocaleString()}`
  } else {
    data._scheduledPublishing = undefined
  }

  // If the content is published and has an unpublishAt date in the past,
  // add a note to the admin UI
  if (
    data.status === 'published' &&
    data.isPublished === true &&
    unpublishAt &&
    unpublishAt <= now
  ) {
    data._scheduledUnpublishing = `This content was unpublished on ${unpublishAt.toLocaleString()}`
  } else if (
    data.status === 'published' &&
    data.isPublished === true &&
    unpublishAt &&
    unpublishAt > now
  ) {
    data._scheduledUnpublishing = `This content will be unpublished on ${unpublishAt.toLocaleString()}`
  } else {
    data._scheduledUnpublishing = undefined
  }

  // Add a note if the content is manually unpublished
  if (data.status === 'published' && data.isPublished === false) {
    data._manualPublishingNote =
      'This content is manually unpublished and will not be visible to users.'
  } else {
    data._manualPublishingNote = undefined
  }

  return data
}
