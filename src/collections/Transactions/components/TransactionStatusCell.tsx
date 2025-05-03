'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const TransactionStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = cellData || 'unknown'
  
  // Define colors for different statuses
  const statusColors = {
    completed: '#10b981', // green
    pending: '#f59e0b', // amber
    failed: '#ef4444', // red
    refunded: '#6b7280', // gray
    unknown: '#6b7280', // gray
  }
  
  // Define labels for better readability
  const statusLabels = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    refunded: 'Refunded',
    unknown: 'Unknown',
  }
  
  const color = statusColors[status] || statusColors.unknown
  const label = statusLabels[status] || statusLabels.unknown
  
  return (
    <div style={{ 
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: `${color}20`, // 20% opacity
      color: color,
      fontWeight: 'bold',
      fontSize: '0.875rem',
    }}>
      {label}
    </div>
  )
}

export default TransactionStatusCell
