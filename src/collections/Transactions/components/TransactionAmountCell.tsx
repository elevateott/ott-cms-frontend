'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const TransactionAmountCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  if (cellData === undefined || cellData === null) {
    return <span>N/A</span>
  }
  
  // Format the amount as currency (convert from cents to dollars)
  const amount = Number(cellData) / 100
  
  return (
    <span style={{ 
      fontWeight: 'bold',
      color: amount > 0 ? '#10b981' : '#ef4444',
    }}>
      {new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)}
    </span>
  )
}

export default TransactionAmountCell
