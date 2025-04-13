'use client'

import React, { useState, useEffect } from 'react'
import VideoAdmin from '@/collections/Videos/components/VideoAdmin'
import WebhookNote from './WebhookNote'
import type { BeforeListClientProps } from 'payload'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

// This component will be rendered before the default list view
export default function VideoManagementComponent(_props: BeforeListClientProps) {
  // Use localStorage to persist the user's preference
  const [showCustomView, setShowCustomView] = useState<boolean>(true)

  // Load the user's preference from localStorage on component mount
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem('showVideoCustomView')
      if (savedPreference !== null) {
        setShowCustomView(savedPreference === 'true')
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
  }, [])

  // Save the user's preference to localStorage when it changes
  const handleToggleChange = (checked: boolean) => {
    setShowCustomView(checked)
    try {
      localStorage.setItem('showVideoCustomView', checked.toString())
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  return (
    <div className="p-6 w-full mb-10 bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold">Video Management</h2>
        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-md">
          <Label htmlFor="show-custom-view" className="text-sm font-medium cursor-pointer">
            {showCustomView ? 'Hide Grid View' : 'Show Grid View'}
          </Label>
          <Switch
            id="show-custom-view"
            checked={showCustomView}
            onCheckedChange={handleToggleChange}
          />
        </div>
      </div>

      {showCustomView && (
        <div className="mb-8">
          <WebhookNote />
          <VideoAdmin className="w-full" />
        </div>
      )}

      <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
        <p>
          {showCustomView
            ? 'The standard Payload CMS list view appears below in addition to the grid view.'
            : 'Grid view is hidden. Only the standard Payload CMS list view is displayed below.'}
        </p>
      </div>
    </div>
  )
}
