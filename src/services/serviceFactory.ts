import { MuxService } from './mux/muxService'
import VideoAssetWebhookHandler from './mux/videoAssetWebhookHandler'

export function createMuxService() {
  const tokenId = process.env.MUX_TOKEN_ID
  const tokenSecret = process.env.MUX_TOKEN_SECRET

  if (!tokenId || !tokenSecret) {
    throw new Error('Mux credentials not found in environment variables')
  }

  return new MuxService({
    tokenId,
    tokenSecret,
  })
}

export const createWebhookHandlerService = (payload?: any) => {
  return new VideoAssetWebhookHandler(payload)
}

// Export a service factory object with all service creation methods
export const serviceFactory = {
  createMuxService,
  createWebhookHandlerService,
}
