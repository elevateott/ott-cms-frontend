'use client'

import { clientLogger } from '@/utils/clientLogger'

import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

type StatusMap = { [videoId: string]: string }
type StatusUpdateListener = (videoId: string, status: string) => void

const VideoStatusContext = createContext<{
  statusMap: StatusMap
  updateStatus: (videoId: string, status: string) => void
  subscribeToStatusUpdates: (listener: StatusUpdateListener) => () => void
  getStatus: (videoId: string) => string | undefined
}>({
  statusMap: {},
  updateStatus: () => {},
  subscribeToStatusUpdates: () => () => {},
  getStatus: () => undefined,
})

export const VideoStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [statusMap, setStatusMap] = useState<StatusMap>({})
  const [listeners, setListeners] = useState<StatusUpdateListener[]>([])

  // Debounce mechanism
  const pendingUpdatesRef = useRef<Record<string, { status: string; timeoutId: NodeJS.Timeout }>>(
    {},
  )
  const MIN_UPDATE_INTERVAL = 5000 // 5 seconds minimum between updates for the same video

  // Track the last time we processed an event for each video ID
  const lastEventTimeRef = useRef<Record<string, number>>({})

  // Helper function to check if we should process an event for a video
  const shouldProcessEvent = (videoId: string): boolean => {
    const now = Date.now()
    const lastTime = lastEventTimeRef.current[videoId] || 0
    const timeSinceLastEvent = now - lastTime

    // If it's been less than MIN_UPDATE_INTERVAL since the last event, skip this one
    if (timeSinceLastEvent < MIN_UPDATE_INTERVAL) {
      clientLogger.debug(
        `Skipping event for ${videoId} - processed one ${timeSinceLastEvent}ms ago`,
        'VideoStatusContext',
      )
      return false
    }

    // Update the last event time
    lastEventTimeRef.current[videoId] = now
    return true
  }

  // Function to update a video's status with debouncing
  const updateStatus = useCallback(
    (videoId: string, status: string) => {
      clientLogger.info(
        `🔍 DEBUG [VideoStatusContext] Updating status for video ${videoId} to ${status}`,
        'contexts/VideoStatusContext',
      )

      // Check if there's already a pending update for this video
      const pendingUpdate = pendingUpdatesRef.current[videoId]
      if (pendingUpdate) {
        // Clear the existing timeout
        clearTimeout(pendingUpdate.timeoutId)
        delete pendingUpdatesRef.current[videoId]
        clientLogger.info(
          `🔍 DEBUG [VideoStatusContext] Cleared pending update for video ${videoId}`,
          'contexts/VideoStatusContext',
        )
      }

      // Create a new timeout for this update
      const timeoutId = setTimeout(() => {
        clientLogger.debug(`Processing debounced update for video ${videoId}`, 'VideoStatusContext')

        // Update the status map
        setStatusMap((prevMap) => {
          // Only update if the status has changed
          if (prevMap[videoId] !== status) {
            clientLogger.info(
              `Status changed from ${prevMap[videoId] || 'undefined'} to ${status}`,
              'VideoStatusContext',
            )
            return { ...prevMap, [videoId]: status }
          }
          return prevMap
        })

        // Notify all listeners about the status change
        clientLogger.info(
          `Notifying ${listeners.length} listeners about status change for video ${videoId}`,
          'VideoStatusContext',
        )
        listeners.forEach((listener) => {
          try {
            clientLogger.info(
              `🔍 DEBUG [VideoStatusContext] Calling listener for video ${videoId}`,
              'contexts/VideoStatusContext',
            )
            listener(videoId, status)
          } catch (error) {
            clientLogger.error(
              `🔍 DEBUG [VideoStatusContext] Error in status update listener:`,
              error,
              'contexts/VideoStatusContext',
            )
          }
        })

        // Remove from pending updates
        delete pendingUpdatesRef.current[videoId]
      }, MIN_UPDATE_INTERVAL)

      // Store the pending update
      pendingUpdatesRef.current[videoId] = { status, timeoutId }
    },
    [listeners],
  )

  // Function to get a video's status
  const getStatus = useCallback(
    (videoId: string) => {
      return statusMap[videoId]
    },
    [statusMap],
  )

  // Function to subscribe to status updates
  const subscribeToStatusUpdates = useCallback((listener: StatusUpdateListener) => {
    clientLogger.info(
      `New listener subscribed to status updates, current count: ${listeners.length}`,
      'VideoStatusContext',
    )

    // Generate a unique ID for this listener for debugging
    const listenerId = Math.random().toString(36).substring(2, 9)
    clientLogger.info(
      `🔍 DEBUG [VideoStatusContext] Assigned listener ID: ${listenerId}`,
      'contexts/VideoStatusContext',
    )

    // Wrap the listener to add logging
    const wrappedListener: StatusUpdateListener = (videoId, status) => {
      clientLogger.debug(
        `Calling listener ${listenerId} for video ${videoId} with status ${status}`,
        'VideoStatusContext',
      )
      listener(videoId, status)
    }

    // Add the listener to the list
    setListeners((prevListeners) => [...prevListeners, wrappedListener])

    // Return a function to unsubscribe
    return () => {
      clientLogger.info(
        `🔍 DEBUG [VideoStatusContext] Listener ${listenerId} unsubscribed`,
        'contexts/VideoStatusContext',
      )
      setListeners((prevListeners) => prevListeners.filter((l) => l !== wrappedListener))
    }
  }, [])

  // Listen for video status events from the event bus
  useEventBusOn(
    'video:status:ready',
    (data) => {
      if (data && data.id && shouldProcessEvent(data.id)) {
        clientLogger.info(`Received video:status:ready event for ${data.id}`, 'VideoStatusContext')
        // Force a state update by creating a new status map
        setStatusMap((prevMap) => {
          const newMap = { ...prevMap, [data.id]: 'ready' }
          clientLogger.info(
            `🔍 DEBUG [VideoStatusContext] Updated status map:`,
            newMap,
            'contexts/VideoStatusContext',
          )
          return newMap
        })

        // Also call updateStatus to notify listeners
        updateStatus(data.id, 'ready')
      }
    },
    [updateStatus],
  )

  // Listen for video updated events that include status changes
  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    (data) => {
      if (data && data.id && data.isStatusChange && shouldProcessEvent(data.id)) {
        clientLogger.info(
          `Received VIDEO_UPDATED event with status change for ${data.id}`,
          'VideoStatusContext',
        )
        // Force a state update by creating a new status map
        setStatusMap((prevMap) => {
          const newMap = { ...prevMap, [data.id]: 'ready' }
          clientLogger.info(
            `🔍 DEBUG [VideoStatusContext] Updated status map:`,
            newMap,
            'contexts/VideoStatusContext',
          )
          return newMap
        })

        // Also call updateStatus to notify listeners
        updateStatus(data.id, 'ready')
      }
    },
    [updateStatus],
  )

  // Listen for REFRESH_LIST_VIEW events
  useEventBusOn(
    'REFRESH_LIST_VIEW',
    (data) => {
      if (data && data.id && shouldProcessEvent(data.id)) {
        clientLogger.info(
          `🔍 DEBUG [VideoStatusContext] Received REFRESH_LIST_VIEW event for ${data.id}`,
          'contexts/VideoStatusContext',
        )
        // Force a state update by creating a new status map
        setStatusMap((prevMap) => {
          const newMap = { ...prevMap, [data.id]: 'ready' }
          clientLogger.info(
            `🔍 DEBUG [VideoStatusContext] Updated status map:`,
            newMap,
            'contexts/VideoStatusContext',
          )
          return newMap
        })

        // Also call updateStatus to notify listeners
        updateStatus(data.id, 'ready')
      }
    },
    [updateStatus],
  )

  // Clean up any pending timeouts when unmounting
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      Object.values(pendingUpdatesRef.current).forEach(({ timeoutId }) => {
        clearTimeout(timeoutId)
      })
      pendingUpdatesRef.current = {}
    }
  }, [])

  return (
    <VideoStatusContext.Provider
      value={{ statusMap, updateStatus, subscribeToStatusUpdates, getStatus }}
    >
      {children}
    </VideoStatusContext.Provider>
  )
}

export const useVideoStatus = () => useContext(VideoStatusContext)
