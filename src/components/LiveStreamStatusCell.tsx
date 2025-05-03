'use client'

import React from 'react'

/**
 * LiveStreamStatusCell
 *
 * A component to display the live stream status as a badge in the list view
 */
// Define the props that Payload CMS will pass to the component
interface LiveStreamStatusCellProps {
  cellData?: string
  data?: {
    muxStatus?: string
  }
  field?: {
    name?: string
  }
  rowData?: {
    muxStatus?: string
  }
}

export const LiveStreamStatusCell: React.FC<LiveStreamStatusCellProps> = (props) => {
  // Get the status from cellData, rowData, or data
  const cellData = props.cellData || props.rowData?.muxStatus || props.data?.muxStatus

  if (!cellData) return null

  // Define colors for different statuses
  let backgroundColor = ''
  let textColor = 'white'

  switch (cellData) {
    case 'active':
      backgroundColor = '#2ecc71' // Green
      break
    case 'idle':
      backgroundColor = '#f39c12' // Yellow
      break
    case 'disconnected':
    case 'completed':
      backgroundColor = '#95a5a6' // Gray
      break
    default:
      backgroundColor = '#95a5a6' // Gray
  }

  // Format the status text for display
  const displayStatus = cellData.charAt(0).toUpperCase() + cellData.slice(1)

  return (
    <div
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor,
        color: textColor,
        fontWeight: 'bold',
        fontSize: '12px',
      }}
    >
      {displayStatus}
    </div>
  )
}

export default LiveStreamStatusCell
