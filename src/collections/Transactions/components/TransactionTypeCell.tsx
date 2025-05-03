'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const TransactionTypeCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const type = cellData || 'unknown'
  
  // Define colors and labels for different transaction types
  const typeColors = {
    subscription: '#10b981', // green
    ppv: '#f59e0b', // amber
    rental: '#3b82f6', // blue
    unknown: '#6b7280', // gray
  }
  
  const typeLabels = {
    subscription: 'Subscription',
    ppv: 'Pay-Per-View',
    rental: 'Rental',
    unknown: 'Unknown',
  }
  
  const color = typeColors[type] || typeColors.unknown
  const label = typeLabels[type] || typeLabels.unknown
  
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

export default TransactionTypeCell
