/**
 * Custom webpack plugin to handle cloudflare:sockets imports
 * This plugin intercepts requests for cloudflare:sockets and returns an empty module
 */
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Path to the mock module
const MOCK_MODULE_PATH = resolve(__dirname, './cloudflare-sockets-mock.js')

class CloudflareSocketsPlugin {
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    // Add a custom resolver plugin
    compiler.hooks.normalModuleFactory.tap('CloudflareSocketsPlugin', (factory) => {
      // Intercept the resolver
      factory.hooks.beforeResolve.tap('CloudflareSocketsPlugin', (data) => {
        // Check if the request is for cloudflare:sockets
        if (data.request === 'cloudflare:sockets') {
          // Replace the request with our mock module
          data.request = MOCK_MODULE_PATH
        }
        return data
      })
    })
  }
}

export default CloudflareSocketsPlugin
