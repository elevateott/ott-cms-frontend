/**
 * Service Factory
 *
 * Provides a centralized way to create service instances
 */

import { Payload } from 'payload'
import { VideoRepository } from '@/repositories/videoRepository'
import { MuxService } from '@/services/mux/muxService'
import { MockMuxService } from '@/services/mux/mockMuxService'
import { WebhookHandlerService } from '@/services/mux/webhookHandlerService'
import { appConfig, muxConfig } from '@/config'
import { IMuxService } from '@/services/mux/IMuxService'
import { MuxUploadRequest, MuxAsset, MuxWebhookEvent } from '@/types/mux'
import configPromise from '@payload-config'

export function createVideoRepository(payload: Payload): VideoRepository {
  return new VideoRepository(payload)
}

export function createMuxService(): IMuxService {
  if (appConfig.environment === 'development') {
    console.log('Using mock Mux service for development')
    return new MockMuxService()
  }

  console.log('Using real Mux service')
  return new MuxService({
    tokenId: muxConfig.tokenId,
    tokenSecret: muxConfig.tokenSecret,
  })
}

export function createWebhookHandlerService(
  payload: Payload,
  eventEmitter: (event: string, data: any) => void,
): WebhookHandlerService {
  const videoRepository = createVideoRepository(payload)
  const muxService = createMuxService()

  return new WebhookHandlerService(videoRepository, muxService, eventEmitter)
}

export function createServices(
  payload: Payload,
  eventEmitter: (event: string, data: any) => void,
): {
  videoRepository: VideoRepository
  muxService: IMuxService
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
