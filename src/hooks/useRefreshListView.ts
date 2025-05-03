'use client'

import { logger } from '@/utils/logger'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Custom hook to refresh the Payload CMS list view
 *
 * This hook provides a function to refresh the list view by:
 * 1. Finding and clicking the refresh button in the list view
 * 2. If that fails, refreshing the router
 */
export const useRefreshListView = () => {
  const router = useRouter()

  // Function to refresh the list view
  const refreshListView = useCallback(() => {
    logger.info(
      { context: 'RefreshListView' },
      '🔍 DEBUG [useRefreshListView] Attempting to refresh list view',
    )

    try {
      // Try to find and click the refresh button in the list view
      const refreshButton = document.querySelector(
        '.collection-list button[title="Refresh"]',
      ) as HTMLButtonElement

      if (refreshButton) {
        logger.info(
          { context: 'RefreshListView' },
          '🔍 DEBUG [useRefreshListView] Found refresh button, clicking it',
        )

        // Click the refresh button multiple times with a small delay between clicks
        // This is more aggressive but ensures the list view is refreshed
        refreshButton.click()

        // Schedule additional clicks with delays
        setTimeout(() => {
          logger.info(
            { context: 'RefreshListView' },
            '🔍 DEBUG [useRefreshListView] Clicking refresh button again (1)',
          )
          refreshButton.click()

          // Try one more time after another delay
          setTimeout(() => {
            logger.info(
              { context: 'RefreshListView' },
              '🔍 DEBUG [useRefreshListView] Clicking refresh button again (2)',
            )
            refreshButton.click()
          }, 500)
        }, 500)

        // Successfully clicked the refresh button
        logger.info(
          { context: 'RefreshListView' },
          '🔍 DEBUG [useRefreshListView] Refresh button clicked successfully',
        )

        return true
      } else {
        logger.info(
          { context: 'RefreshListView' },
          'Refresh button not found, using router.refresh()',
        )
        // If the button is not found, use the router to refresh the page
        router.refresh()
        return true
      }
    } catch (error) {
      logger.error(
        { context: 'RefreshListView' },
        '🔍 DEBUG [useRefreshListView] Error refreshing list view:',
        error,
      )
      return false
    }
  }, [router])

  return { refreshListView }
}
