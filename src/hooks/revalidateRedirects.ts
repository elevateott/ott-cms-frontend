import type { CollectionAfterChangeHook } from 'payload'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  payload.logger.info(`Revalidating redirects`)

  // Use fetch to call a revalidation API endpoint instead of direct revalidateTag
  try {
    // This should be replaced with an actual API endpoint that performs the revalidation
    fetch('/api/revalidate?tag=redirects', { method: 'POST' }).catch((err) =>
      payload.logger.error(`Error revalidating redirects: ${err.message}`),
    )
  } catch (error) {
    payload.logger.error(`Error revalidating redirects: ${error}`)
  }

  return doc
}
