'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const StatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = cellData || 'none'
  
  // Define colors for different subscription statuses
  const statusColors = {
    active: '#10b981', // green
    trialing: '#f59e0b', // amber
    past_due: '#ef4444', // red
    canceled: '#6b7280', // gray
    none: '#6b7280', // gray
  }
  
  // Define labels for better readability
  const statusLabels = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    none: 'None',
  }
  
  const color = statusColors[status] || statusColors.none
  const label = statusLabels[status] || statusLabels.none
  
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: color,
          marginRight: '8px',
        }}
      />
      <span style={{ color }}>{label}</span>
    </div>
  )
}

export default StatusCell
