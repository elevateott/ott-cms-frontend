import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'

// Helper function to call revalidation API
const callRevalidationAPI = (payload: any, path?: string, tag?: string) => {
  try {
    let url = '/api/revalidate?'
    if (path) url += `path=${encodeURIComponent(path)}&`
    if (tag) url += `tag=${encodeURIComponent(tag)}`

    fetch(url, { method: 'POST' }).catch((err) =>
      payload.logger.error(`Error calling revalidation API: ${err.message}`),
    )
  } catch (error) {
    payload.logger.error(`Error calling revalidation API: ${error}`)
  }
}

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      // Call revalidation API instead of direct revalidatePath/revalidateTag
      callRevalidationAPI(payload, path, 'posts-sitemap')
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      // Call revalidation API instead of direct revalidatePath/revalidateTag
      callRevalidationAPI(payload, oldPath, 'posts-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    // Call revalidation API instead of direct revalidatePath/revalidateTag
    callRevalidationAPI(payload, path, 'posts-sitemap')
  }

  return doc
}
