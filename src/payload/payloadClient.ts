import { getPayload } from '@/payload'
import { configPromise } from '@/payload.config'

/**
 * Get a Payload client instance
 * This is a convenience function for getting a Payload client without having to pass the config
 */
export const getPayloadClient = async () => {
  return getPayload({ config: configPromise })
}
