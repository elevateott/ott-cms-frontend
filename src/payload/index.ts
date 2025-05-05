import { getPayload as getPayloadOriginal } from 'payload'
import { Config } from 'payload/config'

/**
 * Wrapper around payload's getPayload function
 * This allows us to provide a consistent interface for getting the payload instance
 */
export const getPayload = async ({ 
  config, 
  req = undefined, 
  res = undefined 
}: { 
  config: Promise<Config> | Config, 
  req?: any, 
  res?: any 
}) => {
  // If config is a promise, await it
  const resolvedConfig = config instanceof Promise ? await config : config
  
  // Call the original getPayload function
  return getPayloadOriginal({
    config: resolvedConfig,
    req,
    res,
  })
}
