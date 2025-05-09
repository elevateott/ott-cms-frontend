import payload from 'payload'
import configPromise from '@payload-config'

interface GetPayloadOptions {
  config?: any
  req?: any
  res?: any
}

/**
 * Get a Payload instance
 *
 * @param options Options for initializing Payload
 * @returns Payload instance
 */
export const getPayload = async (options: GetPayloadOptions = {}) => {
  const { config = configPromise, req, res } = options

  // Initialize Payload
  if (req && res) {
    // If req and res are provided, use them
    return payload
  }

  // Otherwise, just return the payload instance
  return payload
}
