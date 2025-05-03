import payload from 'payload'

/**
 * Get the Payload instance safely
 * 
 * In Payload CMS 3.0, you should never use the imported payload directly for local API operations.
 * Instead, you should use req.payload which is passed through the request context.
 * 
 * This utility function provides a fallback for cases where req.payload is not available.
 */
export function getPayload(req?: any) {
  // If req is provided and has a payload property, use it
  if (req?.payload) {
    return req.payload
  }
  
  // Otherwise, use the imported payload as a fallback
  // This is not recommended for production use, but can work for development
  return payload
}
