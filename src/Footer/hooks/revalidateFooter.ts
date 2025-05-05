import type { GlobalAfterChangeHook } from 'payload'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    // Use fetch to call a revalidation API endpoint instead of direct revalidateTag
    try {
      fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/revalidate?tag=global_footer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          revalidateSecret: process.env.REVALIDATION_SECRET || 'default-secret',
        }),
      }).catch((err) => {
        payload.logger.error(`Error revalidating footer: ${err.message}`)
      })
    } catch (error) {
      payload.logger.error(`Error revalidating footer: ${error}`)
    }
  }

  return doc
}
