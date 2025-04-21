'use client'

import React from 'react'
import { CellProps } from 'payload/components/views/Cell'

// This component displays the status in the list view
const StatusField: React.FC<CellProps> = ({ rowData }) => {
  // Default to 'ready' for embedded videos
  if (rowData.sourceType === 'embedded') {
    return <div className="status-badge ready">Ready</div>
  }

  // For Mux videos, show the current status
  const status = rowData.muxData?.status || 'unknown'

  return (
    <div className={`status-badge ${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  )
}

export default StatusField
