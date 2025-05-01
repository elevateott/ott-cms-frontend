import { logger } from '@/utils/logger'
import { createMuxService } from '@/services/mux'
import { MuxSimulcastTarget } from '@/types/mux'
import { logError } from '@/utils/errorHandler'

/**
 * Get all simulcast targets for a live stream
 * @param liveStreamId Mux live stream ID
 */
export async function getSimulcastTargets(liveStreamId: string): Promise<MuxSimulcastTarget[]> {
  try {
    logger.info({ context: 'simulcastService' }, `Fetching simulcast targets for live stream ${liveStreamId}`)
    
    // Get Mux service
    const muxService = await createMuxService()
    
    // Get the live stream
    const liveStream = await muxService.getLiveStream(liveStreamId)
    
    if (!liveStream) {
      throw new Error(`Live stream ${liveStreamId} not found`)
    }
    
    return liveStream.simulcast_targets || []
  } catch (error) {
    logError(error, 'simulcastService.getSimulcastTargets')
    throw new Error(`Failed to fetch simulcast targets: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Create a new simulcast target for a live stream
 * @param liveStreamId Mux live stream ID
 * @param target Simulcast target to create
 */
export async function createSimulcastTarget(
  liveStreamId: string, 
  target: { url: string; stream_key: string; name?: string }
): Promise<MuxSimulcastTarget> {
  try {
    logger.info(
      { context: 'simulcastService' }, 
      `Creating simulcast target for live stream ${liveStreamId}: ${target.name || 'unnamed'}`
    )
    
    // Get Mux service
    const muxService = await createMuxService()
    
    // Make the API request
    const response = await muxService.video._client.post(
      `/video/v1/live-streams/${liveStreamId}/simulcast-targets`,
      {
        url: target.url,
        stream_key: target.stream_key,
        name: target.name,
      }
    )
    
    if (!response || !response.data) {
      throw new Error('Invalid response from Mux API')
    }
    
    logger.info(
      { context: 'simulcastService' }, 
      `Successfully created simulcast target for live stream ${liveStreamId}`
    )
    
    return response.data.data
  } catch (error) {
    logError(error, 'simulcastService.createSimulcastTarget')
    throw new Error(`Failed to create simulcast target: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Delete a simulcast target
 * @param liveStreamId Mux live stream ID
 * @param simulcastTargetId Simulcast target ID
 */
export async function deleteSimulcastTarget(
  liveStreamId: string, 
  simulcastTargetId: string
): Promise<void> {
  try {
    logger.info(
      { context: 'simulcastService' }, 
      `Deleting simulcast target ${simulcastTargetId} from live stream ${liveStreamId}`
    )
    
    // Get Mux service
    const muxService = await createMuxService()
    
    // Make the API request
    await muxService.video._client.delete(
      `/video/v1/live-streams/${liveStreamId}/simulcast-targets/${simulcastTargetId}`
    )
    
    logger.info(
      { context: 'simulcastService' }, 
      `Successfully deleted simulcast target ${simulcastTargetId} from live stream ${liveStreamId}`
    )
  } catch (error) {
    logError(error, 'simulcastService.deleteSimulcastTarget')
    throw new Error(`Failed to delete simulcast target: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Update simulcast targets for a live stream
 * This function compares the existing targets with the new targets and adds/removes as needed
 * @param liveStreamId Mux live stream ID
 * @param newTargets New simulcast targets
 */
export async function updateSimulcastTargets(
  liveStreamId: string,
  newTargets: { url: string; streamKey: string; name?: string }[]
): Promise<void> {
  try {
    logger.info(
      { context: 'simulcastService' }, 
      `Updating simulcast targets for live stream ${liveStreamId}`
    )
    
    // Get existing simulcast targets
    const existingTargets = await getSimulcastTargets(liveStreamId)
    
    // Format the new targets to match Mux API format
    const formattedNewTargets = newTargets.map(target => ({
      url: target.url,
      stream_key: target.streamKey,
      name: target.name,
    }))
    
    // Find targets to delete (exist in existing but not in new)
    const targetsToDelete = existingTargets.filter(existingTarget => {
      return !formattedNewTargets.some(newTarget => 
        newTarget.url === existingTarget.url && 
        newTarget.stream_key === existingTarget.stream_key
      )
    })
    
    // Find targets to add (exist in new but not in existing)
    const targetsToAdd = formattedNewTargets.filter(newTarget => {
      return !existingTargets.some(existingTarget => 
        existingTarget.url === newTarget.url && 
        existingTarget.stream_key === newTarget.stream_key
      )
    })
    
    logger.info(
      { context: 'simulcastService' }, 
      `Found ${targetsToDelete.length} targets to delete and ${targetsToAdd.length} targets to add`
    )
    
    // Delete targets
    for (const target of targetsToDelete) {
      if (target.id) {
        await deleteSimulcastTarget(liveStreamId, target.id)
      }
    }
    
    // Add targets
    for (const target of targetsToAdd) {
      await createSimulcastTarget(liveStreamId, target)
    }
    
    logger.info(
      { context: 'simulcastService' }, 
      `Successfully updated simulcast targets for live stream ${liveStreamId}`
    )
  } catch (error) {
    logError(error, 'simulcastService.updateSimulcastTargets')
    throw new Error(`Failed to update simulcast targets: ${error instanceof Error ? error.message : String(error)}`)
  }
}
