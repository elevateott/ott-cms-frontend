'use client'

import { clientLogger } from '@/utils/clientLogger';


import React, { useEffect } from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { useVideoStatus } from '@/context/VideoStatusContext'

/**
 * StatusCell
 * 
 * A custom cell component for the status column in the Videos list view.
 * This component uses the VideoStatusContext to get real-time status updates.
 */
const StatusCell: React.FC<DefaultCellComponentProps> = (props) => {
  const { rowData, className } = props
  const { statusMap } = useVideoStatus()
  
  const videoId = rowData?.id
  
  // Use status from context if available, otherwise fall back to rowData
  const muxStatus = statusMap[videoId] || rowData?.muxData?.status || 'unknown'
  
  // Log when status changes from context
  useEffect(() => {
    if (statusMap[videoId]) {
      clientLogger.info(`🔍 DEBUG [StatusCell] Video ${videoId} status updated from context: ${statusMap[videoId]}`, 'components/StatusCell')
    }
  }, [statusMap, videoId])

  // Render different badges based on status
  const renderStatusBadge = () => {
    switch (muxStatus) {
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
            {muxStatus || 'Unknown'}
          </span>
        )
    }
  }

  return (
    <div className={className}>
      {renderStatusBadge()}
    </div>
  )
}

export default StatusCell
