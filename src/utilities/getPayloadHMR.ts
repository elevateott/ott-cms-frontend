import { getPayload } from '@/payload'
import { Config } from 'payload/config'

/**
 * Get a Payload instance with HMR support
 * This is a wrapper around getPayload that handles HMR in development
 */
export const getPayloadHMR = async ({ 
  config, 
  req = undefined, 
  res = undefined 
}: { 
  config: Promise<Config> | Config, 
  req?: any, 
  res?: any 
}) => {
  return getPayload({ config, req, res })
}
