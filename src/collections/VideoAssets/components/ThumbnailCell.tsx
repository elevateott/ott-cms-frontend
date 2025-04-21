'use client'

import React from 'react'
import { CellProps } from 'payload/components/views/Cell'

// This component displays a thumbnail in the list view
const ThumbnailCell: React.FC<CellProps> = ({ rowData }) => {
  const { muxThumbnailUrl, thumbnail } = rowData

  // Use custom thumbnail if available, otherwise use Mux thumbnail
  const thumbnailUrl = thumbnail?.url || muxThumbnailUrl

  if (!thumbnailUrl) {
    return <div className="thumbnail-placeholder">No Thumbnail</div>
  }

  return (
    <div className="thumbnail-cell">
      <img
        src={thumbnailUrl}
        alt={rowData.title || 'Video thumbnail'}
        style={{
          width: '100px',
          height: '56px',
          objectFit: 'cover',
          borderRadius: '4px',
        }}
      />
    </div>
  )
}

export default ThumbnailCell
