/**
 * Service Factory
 *
 * Provides a centralized way to create service instances
 */

import { Payload } from 'payload'
import { VideoRepository } from '@/repositories/videoRepository'
import { MuxService } from './mux/muxService'
import { MockMuxService } from './mux/mockMuxService'
import { WebhookHandlerService } from './mux/webhookHandlerService'
import { appConfig } from '@/config'

/**
 * Create a VideoRepository instance
 */
export function createVideoRepository(payload: Payload): VideoRepository {
  return new VideoRepository(payload)
}

/**
 * Create a MuxService instance
 */
export function createMuxService(): MuxService | MockMuxService {
  // In development mode, use the mock service
  if (appConfig.environment === 'development') {
    console.log('Using mock Mux service for development')
    return new MockMuxService()
  }

  // In production, use the real service
  console.log('Using real Mux service')
  return new MuxService()
}

/**
 * Create a WebhookHandlerService instance
 */
export function createWebhookHandlerService(
  payload: Payload,
  eventEmitter: (event: string, data: any) => void,
): WebhookHandlerService {
  const videoRepository = createVideoRepository(payload)
  const muxService = createMuxService()

  return new WebhookHandlerService(videoRepository, muxService, eventEmitter)
}

/**
 * Create all services
 */
export function createServices(
  payload: Payload,
  eventEmitter: (event: string, data: any) => void,
): {
  videoRepository: VideoRepository
  muxService: MuxService
  webhookHandlerService: WebhookHandlerService
} {
  const videoRepository = createVideoRepository(payload)
  const muxService = createMuxService()
  const webhookHandlerService = new WebhookHandlerService(videoRepository, muxService, eventEmitter)

  return {
    videoRepository,
    muxService,
    webhookHandlerService,
  }
}
