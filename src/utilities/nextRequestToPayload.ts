// src/utilities/nextRequestToPayload.ts
import { NextRequest } from 'next/server'
import { IncomingHttpHeaders } from 'http'

/**
 * Converts a Next.js NextRequest to a format compatible with Payload's auth function
 * This is needed because Payload's auth function expects a different request format
 */
export const convertNextRequestToPayload = (req: NextRequest) => {
  // Extract headers from NextRequest and convert to format Payload expects
  const headers: IncomingHttpHeaders = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  // Get the URL from the request
  const url = new URL(req.url)

  // Create a payload-compatible request object
  return {
    headers,
    cookies: Object.fromEntries(req.cookies.getAll().map((cookie) => [cookie.name, cookie.value])),
    // Add URL-related properties that Payload needs
    url: req.url,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    search: url.search,
    host: url.host,
    hostname: url.hostname,
    origin: url.origin,
    protocol: url.protocol.replace(':', ''),
    // Add other required properties
    method: req.method,
    // Use type assertion to satisfy TypeScript
  } as any
}
