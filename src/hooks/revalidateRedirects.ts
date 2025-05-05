import type { CollectionAfterChangeHook } from 'payload'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  payload.logger.info(`Revalidating redirects`)

  // Use fetch to call a revalidation API endpoint instead of direct revalidateTag
  try {
    fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/revalidate?tag=redirects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revalidateSecret: process.env.REVALIDATION_SECRET || 'default-secret',
      }),
    }).catch((err) => {
      payload.logger.error(`Error revalidating redirects: ${err.message}`)
    })
  } catch (error) {
    payload.logger.error(`Error revalidating redirects: ${error}`)
  }

  return doc
}
