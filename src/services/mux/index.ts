import { MuxService } from './muxService'
import { MockMuxService } from './mockMuxService'
import { IMuxService } from './IMuxService'
import { getMuxSettings } from '@/utilities/getMuxSettings'
import { logger } from '@/utils/logger'

let muxServiceInstance: IMuxService | null = null

export const createMuxService = async (): Promise<IMuxService> => {
  // Return existing instance if already created
  if (muxServiceInstance) {
    return muxServiceInstance
  }

  // Check if we're in development and mock mode is enabled
  if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_MUX === 'true') {
    logger.info({ context: 'muxService' }, 'Using mock Mux service for development')
    muxServiceInstance = new MockMuxService()
    return muxServiceInstance
  }

  try {
    // Get Mux settings from global configuration
    const muxSettings = await getMuxSettings()
    const tokenId = muxSettings.tokenId
    const tokenSecret = muxSettings.tokenSecret

    if (!tokenId || !tokenSecret) {
      logger.error(
        { context: 'muxService' },
        'Missing Mux credentials in global settings and environment variables',
      )
      if (process.env.NODE_ENV === 'development') {
        logger.info(
          { context: 'muxService' },
          'Falling back to mock service due to missing credentials',
        )
        muxServiceInstance = new MockMuxService()
        return muxServiceInstance
      }
      throw new Error(
        'Mux API credentials are required in global settings or environment variables',
      )
    }

    logger.info(
      { context: 'muxService' },
      'Initializing Mux service with token ID:',
      tokenId.substring(0, 8) + '...',
    )

    const instance = new MuxService({
      tokenId,
      tokenSecret,
    })

    // Set the static instance for utility methods
    MuxService.setInstance(instance)

    muxServiceInstance = instance
    return muxServiceInstance
  } catch (error) {
    logger.error({ context: 'muxService' }, 'Failed to initialize Mux service:', error)
    if (process.env.NODE_ENV === 'development') {
      logger.info(
        { context: 'muxService' },
        'Falling back to mock service due to initialization error',
      )
      muxServiceInstance = new MockMuxService()
      return muxServiceInstance
    }
    throw error
  }
}
