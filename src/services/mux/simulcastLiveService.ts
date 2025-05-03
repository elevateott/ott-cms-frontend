import { logger } from '@/utils/logger'
import { createMuxService } from '@/services/mux'
import { logError } from '@/utils/errorHandler'

/**
 * Create a simulated live stream using Mux's Simulcast API
 * 
 * @param assetId - The Mux asset ID to use for the simulated live stream
 * @param startTime - ISO 8601 timestamp for when the stream should start
 * @param playbackPolicy - Optional playback policy (defaults to 'public')
 * @returns Object containing the simulcast ID and playback ID
 */
export async function createSimulatedLive({
  assetId,
  startTime,
  playbackPolicy = 'public',
}: {
  assetId: string
  startTime: string
  playbackPolicy?: 'public' | 'signed'
}): Promise<{
  simulcastId: string
  playbackId: string
}> {
  try {
    logger.info(
      { context: 'simulcastLiveService' },
      `Creating simulated live stream for asset ${assetId} starting at ${startTime}`
    )

    // Get Mux service
    const muxService = await createMuxService()

    // Make the API request to create a simulcast
    const response = await muxService.video._client.post('/video/v1/simulcast', {
      asset_id: assetId,
      scheduled_time: startTime,
      playback_policy: [playbackPolicy],
    })

    if (!response || !response.data) {
      throw new Error('Invalid response from Mux API')
    }

    const simulcastId = response.data.id
    const playbackId = response.data.playback_ids?.[0]?.id

    if (!simulcastId || !playbackId) {
      throw new Error('Missing simulcast ID or playback ID in Mux response')
    }

    logger.info(
      { context: 'simulcastLiveService' },
      `Successfully created simulated live stream with ID: ${simulcastId}`
    )

    return {
      simulcastId,
      playbackId,
    }
  } catch (error) {
    logError(error, 'simulcastLiveService.createSimulatedLive')
    throw new Error(
      `Failed to create simulated live stream: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Get a simulated live stream by ID
 * 
 * @param simulcastId - The Mux simulcast ID
 * @returns The simulcast object or null if not found
 */
export async function getSimulatedLive(simulcastId: string): Promise<any | null> {
  try {
    logger.info(
      { context: 'simulcastLiveService' },
      `Fetching simulated live stream ${simulcastId}`
    )

    // Get Mux service
    const muxService = await createMuxService()

    // Make the API request to get the simulcast
    const response = await muxService.video._client.get(`/video/v1/simulcast/${simulcastId}`)

    if (!response || !response.data) {
      return null
    }

    return response.data
  } catch (error) {
    logError(error, 'simulcastLiveService.getSimulatedLive')
    return null
  }
}

/**
 * Delete a simulated live stream
 * 
 * @param simulcastId - The Mux simulcast ID
 * @returns True if successful, false otherwise
 */
export async function deleteSimulatedLive(simulcastId: string): Promise<boolean> {
  try {
    logger.info(
      { context: 'simulcastLiveService' },
      `Deleting simulated live stream ${simulcastId}`
    )

    // Get Mux service
    const muxService = await createMuxService()

    // Make the API request to delete the simulcast
    await muxService.video._client.delete(`/video/v1/simulcast/${simulcastId}`)

    logger.info(
      { context: 'simulcastLiveService' },
      `Successfully deleted simulated live stream ${simulcastId}`
    )

    return true
  } catch (error) {
    logError(error, 'simulcastLiveService.deleteSimulatedLive')
    return false
  }
}
