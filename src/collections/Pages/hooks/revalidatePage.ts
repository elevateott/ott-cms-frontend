import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Page } from '../../../payload-types'

// Helper function to revalidate via API
const revalidateViaAPI = (payload: any, path?: string, tag?: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const url = new URL(`${baseUrl}/api/revalidate`)

  if (path) url.searchParams.append('path', path)
  if (tag) url.searchParams.append('tag', tag)

  try {
    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revalidateSecret: process.env.REVALIDATION_SECRET || 'default-secret',
      }),
    }).catch((err) => {
      payload.logger.error(`Error revalidating: ${err.message}`)
    })
  } catch (error) {
    payload.logger.error(`Error revalidating: ${error}`)
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

      revalidateViaAPI(payload, path)
      revalidateViaAPI(payload, undefined, 'pages-sitemap')
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`

      payload.logger.info(`Revalidating old page at path: ${oldPath}`)

      revalidateViaAPI(payload, oldPath)
      revalidateViaAPI(payload, undefined, 'pages-sitemap')
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
    revalidateViaAPI(payload, path)
    revalidateViaAPI(payload, undefined, 'pages-sitemap')
  }

  return doc
}
