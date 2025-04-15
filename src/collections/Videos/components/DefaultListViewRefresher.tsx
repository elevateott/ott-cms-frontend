'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEventBusOn } from '@/hooks/useEventBus'
import { EVENTS } from '@/constants/events'

/**
 * DefaultListViewRefresher
 * 
 * This component listens for video_created and video_updated events
 * and refreshes the default Payload CMS list view when they occur.
 * 
 * It's designed to be added to the beforeList array in the Videos collection config.
 */
const DefaultListViewRefresher: React.FC = () => {
  const router = useRouter()

  // Function to refresh the current page
  const refreshPage = () => {
    console.log('Refreshing default list view due to Mux webhook event')
    router.refresh()
  }

  // Listen for video_created events
  useEventBusOn(
    EVENTS.VIDEO_CREATED,
    () => {
      // Add a small delay to ensure the database has been updated
      setTimeout(refreshPage, 500)
    },
    [refreshPage],
  )

  // Listen for video_updated events
  useEventBusOn(
    EVENTS.VIDEO_UPDATED,
    () => {
      // Add a small delay to ensure the database has been updated
      setTimeout(refreshPage, 500)
    },
    [refreshPage],
  )

  // This component doesn't render anything visible
  return null
}

export default DefaultListViewRefresher
