/**
 * Utility to get the current user from session
 *
 * This function retrieves the current user from cookies or headers
 * depending on the context (server or client component)
 */
import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

export interface SessionUser {
  id?: string
  email?: string
  subscriberId?: string
  subscriberToken?: string
}

/**
 * Get the current user from session
 *
 * @returns The current user or null if not authenticated
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    // Try to get the payload token from cookies (for server components)
    const cookieStore = cookies()
    const payloadToken = cookieStore.get('payload-token')?.value

    // Try to get the subscriber token from cookies
    const subscriberToken = cookieStore.get('subscriber-token')?.value

    // If we have a payload token, get the user from Payload
    if (payloadToken) {
      const payload = await getPayload({ config: configPromise })
      const { user } = await payload.auth({ headers: { Authorization: `JWT ${payloadToken}` } })

      if (user) {
        return {
          id: user.id,
          email: user.email,
        }
      }
    }

    // If we have a subscriber token, get the subscriber from Payload
    if (subscriberToken) {
      const payload = await getPayload({ config: configPromise })

      const subscriberResult = await payload.find({
        collection: 'subscribers',
        where: {
          subscriberToken: {
            equals: subscriberToken,
          },
        },
        limit: 1,
      })

      if (subscriberResult.docs.length) {
        const subscriber = subscriberResult.docs[0]

        return {
          subscriberId: subscriber.id,
          email: subscriber.email,
          subscriberToken,
        }
      }
    }

    // Try to get the subscriber ID from headers (for API routes)
    const headersList = headers()
    const headerSubscriberId = headersList.get('x-subscriber-id')
    const headerSubscriberToken = headersList.get('x-subscriber-token')

    if (headerSubscriberId && headerSubscriberToken) {
      const payload = await getPayload({ config: configPromise })

      const subscriber = await payload.findByID({
        collection: 'subscribers',
        id: headerSubscriberId,
      })

      if (subscriber && subscriber.subscriberToken === headerSubscriberToken) {
        return {
          subscriberId: subscriber.id,
          email: subscriber.email,
          subscriberToken: headerSubscriberToken,
        }
      }
    }

    // No authenticated user found
    return null
  } catch (error) {
    logger.error({ error, context: 'getSessionUser' }, 'Error getting session user')
    return null
  }
}
