'use client'

import { clientLogger } from '@/utils/clientLogger'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useEventBusMulti } from '@/hooks/useEventBus'
import { eventBus } from '@/services/events/eventEmitter'
import { EVENTS } from '@/constants/events'

// Create a context-specific logger
const logger = clientLogger.createContextLogger('ListViewRefresher')

/**
 * ListViewRefresher
 *
 * This component is specifically designed to refresh the Payload CMS list view
 * when videos are created or updated. It listens for events and triggers a refresh
 * of the list view without reloading the entire page.
 */

const POLL_INTERVAL = 10000 // 10 seconds

const ListViewRefresher: React.FC = () => {
  logger.debug('ListViewRefresher component initializing')
  const router = useRouter()
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  // Track polling interval
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Add lifecycle logging
  useEffect(() => {
    logger.info('ListViewRefresher component mounted')
    return () => {
      logger.info('ListViewRefresher component unmounting')
      // Ensure we clean up any intervals
      if (pollingRef.current) {
        logger.debug('Cleaning up polling interval on unmount')
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const forceRefresh = useCallback(
    (source?: string): void => {
      logger.info(`Forcing refresh${source ? ` from ${source}` : ''}`, {
        source,
        refreshCount: refreshCount + 1,
        lastRefreshed: lastRefreshed?.toISOString() || 'never',
      })
      router.refresh()
      setLastRefreshed(new Date())
      setRefreshCount((prev) => prev + 1)
    },
    [lastRefreshed, refreshCount, router],
  )

  // Start polling if not already polling
  const startPolling = useCallback(() => {
    // Only start polling if we don't already have a polling interval
    if (!pollingRef.current) {
      logger.info('Starting polling interval', {
        pollInterval: POLL_INTERVAL,
        currentRefreshCount: refreshCount,
      })

      // Set a maximum number of poll attempts to avoid excessive API calls
      let pollCount = 0
      const MAX_POLL_COUNT = 100 // Maximum number of times to poll

      pollingRef.current = setInterval(() => {
        pollCount++
        logger.debug(`Polling refresh ${pollCount}/${MAX_POLL_COUNT}`, {
          pollCount,
          maxPollCount: MAX_POLL_COUNT,
          pollInterval: POLL_INTERVAL,
          totalElapsedTime: (pollCount * POLL_INTERVAL) / 1000 + ' seconds',
        })

        // If we've reached the maximum number of polls, stop polling
        if (pollCount >= MAX_POLL_COUNT) {
          logger.warn('Reached maximum poll count, stopping polling', {
            pollCount,
            maxPollCount: MAX_POLL_COUNT,
            totalPollingTime: (pollCount * POLL_INTERVAL) / 1000 + ' seconds',
          })
          if (pollingRef.current) {
            logger.debug('Clearing interval due to max count reached')
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          return
        }

        forceRefresh('polling')
      }, POLL_INTERVAL)
    } else {
      logger.debug('Polling already active, not starting another interval')
    }
  }, [forceRefresh, refreshCount])

  // Stop polling if no videos are pending
  const stopPolling = useCallback((reason: string = 'unspecified') => {
    if (pollingRef.current) {
      logger.info('Stopping polling interval', { reason })
      clearInterval(pollingRef.current)
      pollingRef.current = null
    } else {
      logger.debug('No active polling to stop', { reason })
    }
  }, [])

  // Debounce refresh to prevent excessive calls
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastEventTimeRef = useRef<number>(0)
  const MIN_REFRESH_INTERVAL = 2000 // 2 seconds minimum between refreshes

  const debouncedRefresh = useCallback(
    (source: string) => {
      const now = Date.now()
      const timeSinceLastEvent = now - lastEventTimeRef.current

      logger.debug(`Processing refresh request from ${source}`, {
        source,
        timeSinceLastEvent: `${timeSinceLastEvent}ms`,
        minInterval: `${MIN_REFRESH_INTERVAL}ms`,
        hasExistingTimeout: refreshTimeoutRef.current !== null,
      })

      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        logger.debug('Clearing existing timeout', { source })
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }

      // If we've refreshed recently, set a timeout for the remaining time
      if (timeSinceLastEvent < MIN_REFRESH_INTERVAL) {
        const delay = MIN_REFRESH_INTERVAL - timeSinceLastEvent
        logger.info(`Debouncing refresh from ${source} for ${delay}ms`, {
          source,
          delay: `${delay}ms`,
          timeSinceLastEvent: `${timeSinceLastEvent}ms`,
          minInterval: `${MIN_REFRESH_INTERVAL}ms`,
        })

        refreshTimeoutRef.current = setTimeout(() => {
          logger.debug(`Executing debounced refresh from ${source} after ${delay}ms delay`)
          forceRefresh(`${source} (debounced)`)
          lastEventTimeRef.current = Date.now()
        }, delay)
      } else {
        // Otherwise refresh immediately
        logger.debug(`Executing immediate refresh from ${source}`, {
          timeSinceLastEvent: `${timeSinceLastEvent}ms`,
          minInterval: `${MIN_REFRESH_INTERVAL}ms`,
        })
        forceRefresh(source)
        lastEventTimeRef.current = now
      }
    },
    [forceRefresh],
  )

  // Use useEventBusMulti to handle all events
  useEventBusMulti({
    [EVENTS.VIDEO_CREATED]: () => {
      logger.info('Received VIDEO_CREATED event')
      startPolling()
      debouncedRefresh('VIDEO_CREATED')
    },
    [EVENTS.VIDEO_UPLOAD_COMPLETED]: () => {
      logger.info('Received VIDEO_UPLOAD_COMPLETED event')
      startPolling()
    },
    [EVENTS.VIDEO_STATUS_READY]: () => {
      logger.info('Received VIDEO_STATUS_READY event')
      stopPolling('video-ready')
      debouncedRefresh(EVENTS.VIDEO_STATUS_READY)
    },
    [EVENTS.VIDEO_UPDATED]: (data) => {
      logger.info('Received VIDEO_UPDATED event', { data })
      if (data?.isStatusChange) {
        logger.debug('Status change detected, refreshing list')
        debouncedRefresh('VIDEO_UPDATED')
      } else {
        logger.debug('Non-status update, no refresh needed')
      }
    },
    [EVENTS.VIDEO_STATUS_UPDATED]: () => {
      logger.info('Received VIDEO_STATUS_UPDATED event')
      debouncedRefresh(EVENTS.VIDEO_STATUS_UPDATED)
    },
    [EVENTS.VIDEO_UPLOAD_STARTED]: () => {
      logger.info('Received VIDEO_UPLOAD_STARTED event')
      debouncedRefresh(EVENTS.VIDEO_UPLOAD_STARTED)
    },
    [EVENTS.VIDEO_UPLOAD_ERROR]: () => {
      logger.info('Received VIDEO_UPLOAD_ERROR event')
      debouncedRefresh(EVENTS.VIDEO_UPLOAD_ERROR)
    },
    RELOAD_PAGE: () => {
      logger.info('Received RELOAD_PAGE event')
      debouncedRefresh('RELOAD_PAGE')
    },
  })

  useEffect(() => {
    logger.debug('Setting up cleanup effect')
    return () => {
      logger.info('Running cleanup on component unmount')
      stopPolling('component-unmount')
      if (refreshTimeoutRef.current) {
        logger.debug('Clearing timeout on unmount')
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [stopPolling])

  // Connect to SSE stream directly
  useEffect(() => {
    logger.info('🔌 ListViewRefresher: Connecting to SSE stream...')
    const eventSource = new EventSource('/api/events/stream')

    // Handle connection open
    eventSource.onopen = () => {
      logger.info('✅ ListViewRefresher: SSE connection opened successfully')
    }

    // Handle connection error
    eventSource.onerror = (error) => {
      logger.error('❌ ListViewRefresher: SSE connection error', { error })
    }

    // Handle connected event
    eventSource.addEventListener('connected', (event) => {
      try {
        const data = JSON.parse(event.data)
        logger.info('🔔 ListViewRefresher: Received connected event from server', {
          connectionId: data.connectionId,
          timestamp: data.timestamp,
        })
      } catch (err) {
        logger.error('❌ ListViewRefresher: Error parsing connected event data', { error: err })
      }
    })

    // Handle ping events
    eventSource.addEventListener('ping', (event) => {
      logger.debug('🔄 ListViewRefresher: Received ping from server', { timestamp: event.data })
    })

    // Register listeners for all events directly from SSE
    Object.values(EVENTS).forEach((eventName) => {
      logger.debug(`📝 ListViewRefresher: Registering SSE listener for event: ${eventName}`)
      eventSource.addEventListener(eventName, (event) => {
        try {
          const data = JSON.parse(event.data)
          logger.info(`📢 ListViewRefresher: Received SSE event: ${eventName}`, {
            eventName,
            eventData: data,
            timestamp: new Date().toISOString(),
            source: data.source || 'unknown',
          })

          // Handle different event types
          switch (eventName) {
            case EVENTS.VIDEO_CREATED:
              logger.info('🎞️ ListViewRefresher: Processing VIDEO_CREATED event from SSE')
              startPolling()
              debouncedRefresh('VIDEO_CREATED (SSE)')
              break

            case EVENTS.VIDEO_UPLOAD_COMPLETED:
              logger.info('📼 ListViewRefresher: Processing VIDEO_UPLOAD_COMPLETED event from SSE')
              startPolling()
              break

            case EVENTS.VIDEO_STATUS_READY:
              logger.info('🟢 ListViewRefresher: Processing VIDEO_STATUS_READY event from SSE')
              stopPolling('video-ready (SSE)')
              debouncedRefresh(`${eventName} (SSE)`)
              break

            case EVENTS.VIDEO_UPDATED:
              logger.info('📝 ListViewRefresher: Processing VIDEO_UPDATED event from SSE', {
                data,
                isStatusChange: data?.isStatusChange || false,
              })
              if (data?.isStatusChange) {
                logger.debug(
                  '🟡 ListViewRefresher: Status change detected from SSE, refreshing list',
                )
                debouncedRefresh(`${eventName} (SSE)`)
              } else {
                logger.debug('🟠 ListViewRefresher: Non-status update from SSE, no refresh needed')
              }
              break

            case EVENTS.VIDEO_STATUS_UPDATED:
            case EVENTS.VIDEO_UPLOAD_STARTED:
            case EVENTS.VIDEO_UPLOAD_ERROR:
              logger.info(`💬 ListViewRefresher: Processing ${eventName} event from SSE`)
              debouncedRefresh(`${eventName} (SSE)`)
              break

            default:
              logger.debug(`❓ ListViewRefresher: Unhandled event type from SSE: ${eventName}`)
          }
        } catch (err) {
          logger.error(`❌ ListViewRefresher: Error parsing SSE event data for ${eventName}:`, {
            error: err,
          })
        }
      })
    })

    return () => {
      logger.info('🔒 ListViewRefresher: Closing SSE connection')
      eventSource.close()
      logger.info('🔓 ListViewRefresher: SSE connection closed')
    }
  }, [debouncedRefresh, startPolling, stopPolling])

  // Handle manual refresh
  const handleManualRefresh = useCallback(() => {
    logger.info('Manual refresh requested by user')
    forceRefresh('manual-refresh')
  }, [forceRefresh])

  // Log render
  logger.debug('Rendering ListViewRefresher component', {
    refreshCount,
    lastRefreshed: lastRefreshed?.toISOString(),
    isPolling: pollingRef.current !== null,
  })

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 p-2 rounded-md shadow-md z-50 text-xs">
      <div className="font-medium text-green-800">List View Refresher Active</div>
      {lastRefreshed && (
        <div className="text-green-600">Last refreshed: {lastRefreshed.toLocaleTimeString()}</div>
      )}
      <div className="text-green-600">Events: {refreshCount}</div>
      <div className="text-green-600">
        Status: {pollingRef.current ? 'Polling active' : 'Waiting for events'}
      </div>
      <button
        onClick={handleManualRefresh}
        className="mt-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Refresh Now
      </button>
    </div>
  )
}

export default ListViewRefresher
