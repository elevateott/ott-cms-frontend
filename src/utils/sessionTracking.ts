/**
 * Utilities for tracking subscriber sessions and devices
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'
import { getOTTSettings } from '@/utils/getOTTSettings'
import crypto from 'crypto'

/**
 * Generate a device ID based on browser fingerprint or UUID
 * @returns A unique device identifier
 */
export function generateDeviceId(userAgent?: string): string {
  // If we have a user agent, use it to create a more stable ID
  if (userAgent) {
    // Create a hash of the user agent to use as part of the device ID
    const hash = crypto.createHash('sha256')
    hash.update(userAgent)
    const userAgentHash = hash.digest('hex').substring(0, 8)

    // Combine with a random component for uniqueness
    const randomComponent = crypto.randomBytes(4).toString('hex')
    return `${userAgentHash}-${randomComponent}`
  }

  // Fallback to a completely random UUID
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`
}

/**
 * Get the maximum number of devices allowed for a subscriber
 * @param payload Payload instance
 * @param subscriberId Subscriber ID
 * @returns Maximum number of devices allowed
 */
export async function getMaxDevicesForSubscriber(
  payload: any,
  subscriberId: string,
): Promise<number> {
  try {
    // Get global settings
    const ottSettings = await getOTTSettings()
    const defaultMaxDevices = ottSettings?.features?.defaultMaxDevices || 2
    const deviceLimitingEnabled = ottSettings?.features?.enableDeviceLimiting || false

    // If device limiting is disabled, return a high number
    if (!deviceLimitingEnabled) {
      return 999 // Effectively unlimited
    }

    // Get the subscriber with their active plans
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: subscriberId,
      depth: 1, // Load related plans
    })

    if (!subscriber || !subscriber.activePlans || subscriber.activePlans.length === 0) {
      // No active plans, use default
      return defaultMaxDevices
    }

    // Find the plan with the highest device limit
    let maxDevices = defaultMaxDevices

    for (const plan of subscriber.activePlans) {
      if (plan.maxDevices && plan.maxDevices > maxDevices) {
        maxDevices = plan.maxDevices
      }
    }

    return maxDevices
  } catch (error) {
    logger.error(
      { error, context: 'getMaxDevicesForSubscriber' },
      'Error getting max devices for subscriber',
    )
    return 2 // Default fallback
  }
}

/**
 * Track a subscriber session
 * @param options Session tracking options
 * @returns The updated subscriber
 */
export async function trackSubscriberSession({
  email,
  deviceId,
  ip,
  userAgent,
}: {
  email: string
  deviceId: string
  ip?: string
  userAgent?: string
}): Promise<any> {
  try {
    const payload = await getPayload({ config: configPromise })

    // Find the subscriber by email
    const subRes = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
    })

    const subscriber = subRes.docs[0]
    if (!subscriber) {
      logger.warn(
        { context: 'trackSubscriberSession', email },
        'Attempted to track session for non-existent subscriber',
      )
      return null
    }

    // Get the maximum number of devices allowed for this subscriber
    const maxSessions = await getMaxDevicesForSubscriber(payload, subscriber.id)

    // Get existing sessions or initialize empty array
    const existing = subscriber.activeSessions || []

    // Create the new session object
    const newSession = {
      deviceId,
      ip: ip || null,
      userAgent: userAgent || null,
      lastActive: new Date().toISOString(),
    }

    // Remove any existing session with the same device ID
    const deduped = existing.filter((s: any) => s.deviceId !== deviceId)

    // Add the new session
    let updatedSessions = [...deduped, newSession]

    // If we're over the limit, remove the oldest sessions
    if (updatedSessions.length > maxSessions) {
      // Sort by lastActive (oldest first)
      updatedSessions.sort((a: any, b: any) => {
        return new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime()
      })

      // Keep only the newest sessions up to the limit
      updatedSessions = updatedSessions.slice(-maxSessions)
    }

    // Update the subscriber
    const updatedSubscriber = await payload.update({
      collection: 'subscribers',
      id: subscriber.id,
      data: {
        activeSessions: updatedSessions,
      },
    })

    return updatedSubscriber
  } catch (error) {
    logger.error({ error, context: 'trackSubscriberSession' }, 'Error tracking subscriber session')
    throw error
  }
}

/**
 * Check if a subscriber has reached their device limit
 * @param payload Payload instance
 * @param subscriberId Subscriber ID
 * @returns Boolean indicating if the limit has been reached
 */
export async function hasReachedDeviceLimit(payload: any, subscriberId: string): Promise<boolean> {
  try {
    // Get the subscriber
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: subscriberId,
    })

    if (!subscriber) {
      return false
    }

    // Get the maximum number of devices allowed
    const maxDevices = await getMaxDevicesForSubscriber(payload, subscriberId)

    // Get the current number of active sessions
    const activeSessions = subscriber.activeSessions || []

    // Check if we've reached the limit
    return activeSessions.length >= maxDevices
  } catch (error) {
    logger.error({ error, context: 'hasReachedDeviceLimit' }, 'Error checking device limit')
    return false // Default to allowing access on error
  }
}

/**
 * Remove a specific session for a subscriber
 * @param payload Payload instance
 * @param subscriberId Subscriber ID
 * @param deviceId Device ID to remove
 * @returns The updated subscriber
 */
export async function removeSubscriberSession(
  payload: any,
  subscriberId: string,
  deviceId: string,
): Promise<any> {
  try {
    // Get the subscriber
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: subscriberId,
    })

    if (!subscriber) {
      return null
    }

    // Get existing sessions
    const existing = subscriber.activeSessions || []

    // Remove the session with the matching device ID
    const updatedSessions = existing.filter((s: any) => s.deviceId !== deviceId)

    // Update the subscriber
    const updatedSubscriber = await payload.update({
      collection: 'subscribers',
      id: subscriberId,
      data: {
        activeSessions: updatedSessions,
      },
    })

    return updatedSubscriber
  } catch (error) {
    logger.error({ error, context: 'removeSubscriberSession' }, 'Error removing subscriber session')
    throw error
  }
}
