'use client'

import React from 'react'
import EnhancedVideoAdmin from '@/components/video/VideoAdmin'

// This is a wrapper component that uses our enhanced VideoAdmin component
const VideoAdmin: React.FC = () => {
  return <EnhancedVideoAdmin className="p-4 w-full" />
}

export default VideoAdmin
