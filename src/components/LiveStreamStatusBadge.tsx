'use client'

import React from 'react'

/**
 * LiveStreamStatusBadge
 *
 * A component to display the live stream status as a badge in the admin UI
 */
// Define the props that Payload CMS will pass to the component
interface LiveStreamStatusBadgeProps {
  value?: string
  field?: {
    value?: string
  }
  data?: {
    muxStatus?: string
  }
}

export const LiveStreamStatusBadge: React.FC<LiveStreamStatusBadgeProps> = (props) => {
  // Get the value from props, field, or data
  const status = props.value || props.field?.value || props.data?.muxStatus || ''

  if (!status) return null

  // Define colors for different statuses
  let backgroundColor = ''
  let textColor = 'white'

  switch (status) {
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
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1)

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
        marginLeft: '8px',
      }}
    >
      {displayStatus}
    </div>
  )
}

export default LiveStreamStatusBadge
