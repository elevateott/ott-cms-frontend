'use client'

import React from 'react'
import { VideoStatusProvider } from '@/context/VideoStatusContext'

// This component wraps the Videos collection with the VideoStatusProvider
const VideosCollectionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <VideoStatusProvider>{children}</VideoStatusProvider>
}

export default VideosCollectionWrapper
