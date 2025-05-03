'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

interface RelationshipCountCellProps extends DefaultCellComponentProps {
  rowData: any
  fieldName: string
}

const RelationshipCountCell: React.FC<RelationshipCountCellProps> = ({ rowData, fieldName }) => {
  const items = rowData?.[fieldName] || []
  const count = Array.isArray(items) ? items.length : 0
  
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ 
        display: 'inline-block',
        minWidth: '24px',
        padding: '2px 8px',
        borderRadius: '12px',
        backgroundColor: count > 0 ? '#e0f2fe' : '#f3f4f6',
        color: count > 0 ? '#0369a1' : '#6b7280',
        fontWeight: count > 0 ? 'bold' : 'normal',
      }}>
        {count}
      </span>
    </div>
  )
}

export default RelationshipCountCell
