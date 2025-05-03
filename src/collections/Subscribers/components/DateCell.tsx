'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const DateCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  if (!cellData) return <span>-</span>
  
  // Format the date
  const date = new Date(cellData)
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return <span>Invalid date</span>
  
  // Format the date as a readable string
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  
  // Format the time
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
  
  return (
    <div>
      <div>{formattedDate}</div>
      <div style={{ fontSize: '0.8em', color: '#6b7280' }}>{formattedTime}</div>
    </div>
  )
}

export default DateCell
