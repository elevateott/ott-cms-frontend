'use client'

import React, { useEffect, useState, useCallback } from 'react'
import type { DefaultCellComponentProps } from 'payload'
// We're not using the context directly anymore, just listening to events
// import { useVideoStatus } from '@/context/VideoStatusContext'
import { useEventBusOn } from '@/hooks/useEventBus'

/**
 * StatusField
 *
 * A custom field component for displaying the video status in the list view.
 * This component uses direct event listening to update the status.
 */
const StatusField: React.FC<DefaultCellComponentProps> = (props) => {
  const { rowData, className } = props
  const videoId = rowData?.id

  // Generate a unique component ID for debugging
  const componentId = React.useRef(Math.random().toString(36).substring(2, 9)).current

  // Use local state to track the status
  const [status, setStatus] = useState<string>(rowData?.muxData?.status || 'unknown')

  // Log initial render
  console.log(
    `🔍 DEBUG [StatusField ${componentId}] Initial render for video ${videoId} with status ${status}`,
  )

  // Listen directly for video:status:ready events
  useEventBusOn(
    'video:status:ready',
    (data) => {
      if (data && data.id === videoId) {
        console.log(
          `🔍 DEBUG [StatusField ${componentId}] Received video:status:ready event for video ${videoId}`,
        )
        setStatus('ready')
      }
    },
    [videoId, componentId],
  )

  // Also listen for video-specific events
  useEventBusOn(
    `video:${videoId}:status:ready`,
    (_data) => {
      console.log(
        `🔍 DEBUG [StatusField ${componentId}] Received video:${videoId}:status:ready event`,
      )
      setStatus('ready')
    },
    [videoId, componentId],
  )

  // Also listen for REFRESH_LIST_VIEW events
  useEventBusOn(
    'REFRESH_LIST_VIEW',
    (data) => {
      if (data && data.id === videoId) {
        console.log(
          `🔍 DEBUG [StatusField ${componentId}] Received REFRESH_LIST_VIEW event for video ${videoId}`,
        )
        setStatus('ready')
      }
    },
    [videoId, componentId],
  )

  // Also listen for video_updated events
  useEventBusOn(
    'video_updated',
    (data) => {
      if (data && data.id === videoId && data.isStatusChange) {
        console.log(
          `🔍 DEBUG [StatusField ${componentId}] Received video_updated event with status change for video ${videoId}`,
        )
        setStatus('ready')

        // Also check the database status directly
        checkDatabaseStatus()
      }
    },
    [videoId, componentId],
  )

  // Function to check the database status directly
  const checkDatabaseStatus = useCallback(async () => {
    try {
      console.log(
        `🔍 DEBUG [StatusField ${componentId}] Checking database status for video ${videoId}`,
      )

      // Fetch the video from the API
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        console.error(
          `🔍 DEBUG [StatusField ${componentId}] Failed to fetch video: ${response.status}`,
        )
        return
      }

      const data = await response.json()
      console.log(`🔍 DEBUG [StatusField ${componentId}] Fetched video data:`, data)

      // Check if the status is ready
      if (data && data.muxData && data.muxData.status === 'ready') {
        console.log(
          `🔍 DEBUG [StatusField ${componentId}] Database status is ready, updating component`,
        )
        setStatus('ready')
      }
    } catch (error) {
      console.error(`🔍 DEBUG [StatusField ${componentId}] Error checking database status:`, error)
    }
  }, [videoId, componentId])

  // Check the database status periodically
  useEffect(() => {
    if (!videoId) return

    console.log(
      `🔍 DEBUG [StatusField ${componentId}] Setting up database status check for video ${videoId}`,
    )

    // Check immediately
    checkDatabaseStatus()

    // Then check every 5 seconds
    const intervalId = setInterval(checkDatabaseStatus, 5000)

    return () => {
      console.log(
        `🔍 DEBUG [StatusField ${componentId}] Cleaning up database status check for video ${videoId}`,
      )
      clearInterval(intervalId)
    }
  }, [videoId, componentId, checkDatabaseStatus])

  // Log when status changes
  useEffect(() => {
    console.log(`🔍 DEBUG [StatusField ${componentId}] Status changed to: ${status}`)

    // Force a re-render of the component
    const forceUpdate = () => {
      console.log(`🔍 DEBUG [StatusField ${componentId}] Forcing re-render`)
      setStatus((prevStatus) => {
        if (prevStatus === 'ready') return prevStatus
        return status
      })
    }

    // Schedule multiple updates to ensure the status is displayed correctly
    setTimeout(forceUpdate, 1000)
    setTimeout(forceUpdate, 3000)
    setTimeout(forceUpdate, 5000)
  }, [status, componentId])

  // Render different badges based on status
  const renderStatusBadge = () => {
    switch (status) {
      case 'ready':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Ready
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Processing
          </span>
        )
      case 'uploading':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Uploading
          </span>
        )
      case 'error':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Error
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  return <div className={className}>{renderStatusBadge()}</div>
}

export default StatusField
