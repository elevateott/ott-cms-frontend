/**
 * Mock implementation for cloudflare:sockets
 * This is used to prevent build errors when importing pg-cloudflare
 */
export default {
  connect: () => {
    throw new Error('Cloudflare sockets are not available in this environment')
  },
}
