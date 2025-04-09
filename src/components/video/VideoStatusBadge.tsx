'use client'

/**
 * VideoStatusBadge Component
 *
 * A component for displaying video processing status
 */

import React from 'react'
import { Badge, BadgeProps } from '@/components/ui/badge'
import { VIDEO_STATUS_TYPES } from '@/constants'

export interface VideoStatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status?: string
}

// Map status to variant
const statusVariantMap: Record<string, BadgeProps['variant']> = {
  [VIDEO_STATUS_TYPES.UPLOADING]: 'primary',
  [VIDEO_STATUS_TYPES.PROCESSING]: 'warning',
  [VIDEO_STATUS_TYPES.READY]: 'success',
  [VIDEO_STATUS_TYPES.ERROR]: 'danger',
}

export const VideoStatusBadge: React.FC<VideoStatusBadgeProps> = ({ status, ...props }) => {
  if (!status) return null

  // Get the appropriate variant for the status
  const variant = statusVariantMap[status] || 'default'

  return (
    <Badge variant={variant} {...props}>
      {status}
    </Badge>
  )
}

export default VideoStatusBadge
