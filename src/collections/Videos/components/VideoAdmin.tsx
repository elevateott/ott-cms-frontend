'use client'

import React from 'react'
import EnhancedVideoAdmin from '@/components/video/VideoAdmin'

interface VideoAdminProps {
  className?: string
}

// This is a wrapper component that uses our enhanced VideoAdmin component
const VideoAdmin: React.FC<VideoAdminProps> = ({ className = 'p-4 w-full' }) => {
  return <EnhancedVideoAdmin className={className} />
}

export default VideoAdmin
