import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Page } from '../../../payload-types'

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

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '/' : `/${doc.slug}`

      payload.logger.info(`Revalidating page at path: ${path}`)

      // Call revalidation API instead of direct revalidatePath/revalidateTag
      callRevalidationAPI(payload, path, 'pages-sitemap')
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`

      payload.logger.info(`Revalidating old page at path: ${oldPath}`)

      // Call revalidation API instead of direct revalidatePath/revalidateTag
      callRevalidationAPI(payload, oldPath, 'pages-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`

    // Call revalidation API instead of direct revalidatePath/revalidateTag
    callRevalidationAPI(payload, path, 'pages-sitemap')
  }

  return doc
}
