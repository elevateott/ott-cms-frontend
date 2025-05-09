import type { GlobalAfterChangeHook } from 'payload'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)

    // Use fetch to call a revalidation API endpoint instead of direct revalidateTag
    try {
      // This should be replaced with an actual API endpoint that performs the revalidation
      fetch('/api/revalidate?tag=global_header', { method: 'POST' }).catch((err) =>
        payload.logger.error(`Error revalidating header: ${err.message}`),
      )
    } catch (error) {
      payload.logger.error(`Error revalidating header: ${error}`)
    }
  }

  return doc
}
