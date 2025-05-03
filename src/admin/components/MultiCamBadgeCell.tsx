'use client'

import React from 'react'

/**
 * MultiCamBadgeCell
 *
 * A component to display a badge in the list view for multi-camera events
 */
const MultiCamBadgeCell: React.FC<{ cellData?: boolean }> = (props) => {
  // Get the value from cellData
  const isMultiCam = props.cellData

  if (!isMultiCam) return null

  return (
    <div
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: '#8e44ad', // Purple
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
      }}
    >
      Multi-Cam
    </div>
  )
}

export default MultiCamBadgeCell
