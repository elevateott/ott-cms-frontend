import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'

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

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidateViaAPI(payload, path)
      revalidateViaAPI(payload, undefined, 'posts-sitemap')
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidateViaAPI(payload, oldPath)
      revalidateViaAPI(payload, undefined, 'posts-sitemap')
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

    payload.logger.info(`Revalidating deleted post at path: ${path}`)

    revalidateViaAPI(payload, path)
    revalidateViaAPI(payload, undefined, 'posts-sitemap')
  }

  return doc
}
