import { createMuxService } from '@/services/serviceFactory'

let muxService: ReturnType<typeof createMuxService> | null = null;

export const handleMuxWebhook = async (event: any) => {
  if (!muxService) {
    muxService = createMuxService()
  }

  const webhookHandler = muxService.getWebhookHandlerService()
  await webhookHandler.handleEvent(event)
}

export const fetchMuxMetadata = async (assetId: string) => {
  if (!muxService) {
    muxService = createMuxService()
  }

  // Implementation here
  // Return the metadata for the given asset ID
  return {
    // Add your implementation
  }
}



