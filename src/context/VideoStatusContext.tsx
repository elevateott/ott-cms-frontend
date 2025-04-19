'use client'
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react'
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

  // Function to update a video's status
  const updateStatus = useCallback(
    (videoId: string, status: string) => {
      console.log(`🔍 DEBUG [VideoStatusContext] Updating status for video ${videoId} to ${status}`)

      // Check if the status is actually changing
      setStatusMap((prev) => {
        // If status hasn't changed, don't update
        if (prev[videoId] === status) {
          console.log(
            `🔍 DEBUG [VideoStatusContext] Status for video ${videoId} already set to ${status}, skipping update`,
          )
          return prev
        }

        console.log(
          `🔍 DEBUG [VideoStatusContext] Status for video ${videoId} changing from ${prev[videoId] || 'unknown'} to ${status}`,
        )

        // Status has changed, update it
        const newStatusMap = { ...prev, [videoId]: status }
        return newStatusMap
      })

      // Notify all listeners about the status change regardless of whether the status map was updated
      // This ensures that components always get notified
      console.log(
        `🔍 DEBUG [VideoStatusContext] Notifying ${listeners.length} listeners about status change for video ${videoId}`,
      )
      listeners.forEach((listener) => {
        try {
          console.log(`🔍 DEBUG [VideoStatusContext] Calling listener for video ${videoId}`)
          listener(videoId, status)
        } catch (error) {
          console.error(`🔍 DEBUG [VideoStatusContext] Error in status update listener:`, error)
        }
      })
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
  const subscribeToStatusUpdates = useCallback(
    (listener: StatusUpdateListener) => {
      console.log(
        `🔍 DEBUG [VideoStatusContext] New listener subscribed to status updates, current count: ${listeners.length}`,
      )

      // Generate a unique ID for this listener for debugging
      const listenerId = Math.random().toString(36).substring(2, 9)
      console.log(`🔍 DEBUG [VideoStatusContext] Assigned listener ID: ${listenerId}`)

      // Wrap the listener to add logging
      const wrappedListener: StatusUpdateListener = (videoId, status) => {
        console.log(
          `🔍 DEBUG [VideoStatusContext] Calling listener ${listenerId} for video ${videoId} with status ${status}`,
        )
        listener(videoId, status)
      }

      // Add the listener to our list
      setListeners((prev) => {
        const newListeners = [...prev, wrappedListener]
        console.log(
          `🔍 DEBUG [VideoStatusContext] Listeners count increased to ${newListeners.length}`,
        )
        return newListeners
      })

      // Return a function to unsubscribe
      return () => {
        console.log(
          `🔍 DEBUG [VideoStatusContext] Listener ${listenerId} unsubscribed from status updates`,
        )
        setListeners((prev) => {
          const newListeners = prev.filter((l) => l !== wrappedListener)
          console.log(
            `🔍 DEBUG [VideoStatusContext] Listeners count decreased to ${newListeners.length}`,
          )
          return newListeners
        })
      }
    },
    [listeners],
  )

  // Listen for video status events from the event bus
  useEventBusOn(
    'video:status:ready',
    (data) => {
      if (data && data.id) {
        console.log(
          `🔍 DEBUG [VideoStatusContext] Received video:status:ready event for ${data.id}`,
        )
        // Force a state update by creating a new status map
        setStatusMap((prevMap) => {
          const newMap = { ...prevMap, [data.id]: 'ready' }
          console.log(`🔍 DEBUG [VideoStatusContext] Updated status map:`, newMap)
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
      if (data && data.id && data.isStatusChange) {
        console.log(
          `🔍 DEBUG [VideoStatusContext] Received VIDEO_UPDATED event with status change for ${data.id}`,
        )
        // Force a state update by creating a new status map
        setStatusMap((prevMap) => {
          const newMap = { ...prevMap, [data.id]: 'ready' }
          console.log(`🔍 DEBUG [VideoStatusContext] Updated status map:`, newMap)
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
      if (data && data.id) {
        console.log(`🔍 DEBUG [VideoStatusContext] Received REFRESH_LIST_VIEW event for ${data.id}`)
        // Force a state update by creating a new status map
        setStatusMap((prevMap) => {
          const newMap = { ...prevMap, [data.id]: 'ready' }
          console.log(`🔍 DEBUG [VideoStatusContext] Updated status map:`, newMap)
          return newMap
        })

        // Also call updateStatus to notify listeners
        updateStatus(data.id, 'ready')
      }
    },
    [updateStatus],
  )

  return (
    <VideoStatusContext.Provider
      value={{ statusMap, updateStatus, subscribeToStatusUpdates, getStatus }}
    >
      {children}
    </VideoStatusContext.Provider>
  )
}

export const useVideoStatus = () => useContext(VideoStatusContext)
