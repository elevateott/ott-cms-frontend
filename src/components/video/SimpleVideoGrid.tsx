'use client'

import React from 'react'
import VideoCard from './VideoCard'

interface Video {
  id: string
  title: string
  status?: string
  playbackId?: string
  thumbnailUrl?: string
  duration?: number
  createdAt: string
}

interface SimpleVideoGridProps {
  videos: Video[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
}

const SimpleVideoGrid: React.FC<SimpleVideoGridProps> = ({ videos, onView, onEdit }) => {
  // Use media queries for responsive grid
  const getGridTemplateColumns = () => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width < 640) return 'repeat(1, 1fr)'
      if (width < 768) return 'repeat(2, 1fr)'
      if (width < 1024) return 'repeat(3, 1fr)'
      return 'repeat(4, 1fr)'
    }
    return 'repeat(4, 1fr)' // Default for server-side rendering
  }

  const [gridColumns, setGridColumns] = React.useState(getGridTemplateColumns())

  // Update grid columns on window resize
  React.useEffect(() => {
    const handleResize = () => {
      setGridColumns(getGridTemplateColumns())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: '16px',
        width: '100%',
        border: '2px solid purple',
      }}
    >
      {videos.map((video) => (
        <div key={video.id} style={{ width: '100%', aspectRatio: '16/9' }}>
          <VideoCard
            id={video.id}
            title={video.title}
            status={video.status}
            playbackId={video.playbackId}
            thumbnailUrl={video.thumbnailUrl}
            duration={video.duration}
            createdAt={video.createdAt}
            onView={onView}
            onEdit={onEdit}
            className="w-full"
          />
        </div>
      ))}
    </div>
  )
}

export default SimpleVideoGrid
