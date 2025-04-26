'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const StatusCell: React.FC<DefaultCellComponentProps> = ({ rowData, className }) => {
  // Default to 'ready' for embedded videos
  if (rowData.sourceType === 'embedded') {
    return <div className="status-badge ready">Ready</div>
  }

  const status = rowData?.muxData?.status || 'unknown'

  const renderStatusBadge = () => {
    switch (status) {
      case 'ready':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Ready
          </span>
        )
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Processing
          </span>
        )
      case 'uploading':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Uploading
          </span>
        )
      case 'error':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Error
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  return <div className={className}>{renderStatusBadge()}</div>
}

export default StatusCell
