'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const PlanStatusCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const isActive = cellData === true

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isActive ? '#10b981' : '#ef4444',
          marginRight: '8px',
        }}
      />
      <span style={{ color: isActive ? '#10b981' : '#ef4444' }}>
        {isActive ? 'Active' : 'Archived'}
      </span>
    </div>
  )
}

export default PlanStatusCell
