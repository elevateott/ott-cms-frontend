'use client'

import React from 'react'
import { VideoStatusProvider } from '@/contexts/VideoStatusContext'
import VideoAdmin from '@/components/video/VideoAdmin'

// This component provides the video management UI above the list view
const VideoManagement: React.FC = () => {
  return (
    <VideoStatusProvider>
      <div className="p-6 w-full mb-10 bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">Video Asset Management</h2>
        </div>

        <div className="mb-8">
          <VideoAdmin className="w-full" />
        </div>
      </div>
    </VideoStatusProvider>
  )
}

export default VideoManagement
