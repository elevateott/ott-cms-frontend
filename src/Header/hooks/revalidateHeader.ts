import type { GlobalAfterChangeHook } from 'payload'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)

    // Use fetch to call a revalidation API endpoint instead of direct revalidateTag
    try {
      fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/revalidate?tag=global_header`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revalidateSecret: process.env.REVALIDATION_SECRET || 'default-secret',
        }),
      }).catch((err) => {
        payload.logger.error(`Error revalidating header: ${err.message}`)
      })
    } catch (error) {
      payload.logger.error(`Error revalidating header: ${error}`)
    }
  }

  return doc
}
