'use client'

import React from 'react'
import VideoAdmin from '@/collections/Videos/components/VideoAdmin'
import type { BeforeListClientProps } from 'payload'
import { VideoStatusProvider } from '@/context/VideoStatusContext'

// This component will be rendered before the default list view
export default function VideoManagementComponent(_props: BeforeListClientProps) {
  return (
    <VideoStatusProvider>
      <div className="p-6 w-full mb-10 bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">Video Management</h2>
        </div>

        <div className="mb-8">
          <VideoAdmin className="w-full" />
        </div>
      </div>
    </VideoStatusProvider>
  )
}
