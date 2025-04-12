import React from 'react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { VIDEO_STATUS_TYPES } from '@/constants/index';

interface VideoStatusBadgeProps {
  status: string;
  className?: string;
}

export const VideoStatusBadge: React.FC<VideoStatusBadgeProps> = ({ status, className }) => {
  // Map status to variant
  const statusVariantMap: Record<string, BadgeProps['variant']> = {
    [VIDEO_STATUS_TYPES.UPLOADING]: 'primary',
    [VIDEO_STATUS_TYPES.PROCESSING]: 'warning',
    [VIDEO_STATUS_TYPES.READY]: 'success',
    [VIDEO_STATUS_TYPES.ERROR]: 'danger',
  };

  const variant = statusVariantMap[status] || 'default';

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
};

export default VideoStatusBadge;


