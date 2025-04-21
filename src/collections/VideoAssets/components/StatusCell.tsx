'use client'

import React from 'react'
import { CellProps } from 'payload/components/views/Cell'

// This component displays the Mux status in the list view
const StatusCell: React.FC<CellProps> = ({ rowData, data }) => {
  // Get the status from the cell data
  const status = data || 'unknown'

  // Define colors for different statuses
  const statusColors = {
    uploading: '#3498db', // Blue
    processing: '#f39c12', // Orange
    ready: '#2ecc71', // Green
    error: '#e74c3c', // Red
    unknown: '#95a5a6', // Gray
  }

  const color = statusColors[status] || statusColors.unknown

  return (
    <div
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: color,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  )
}

export default StatusCell
