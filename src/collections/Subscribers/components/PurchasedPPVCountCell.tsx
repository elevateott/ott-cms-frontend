'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const PurchasedPPVCountCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const items = rowData?.purchasedPPV || []
  const count = Array.isArray(items) ? items.length : 0
  
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ 
        display: 'inline-block',
        minWidth: '24px',
        padding: '2px 8px',
        borderRadius: '12px',
        backgroundColor: count > 0 ? '#fef3c7' : '#f3f4f6',
        color: count > 0 ? '#92400e' : '#6b7280',
        fontWeight: count > 0 ? 'bold' : 'normal',
      }}>
        {count}
      </span>
    </div>
  )
}

export default PurchasedPPVCountCell
