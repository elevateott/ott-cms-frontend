'use client';

/**
 * VideoGrid Component
 * 
 * A grid layout for displaying multiple videos
 */

import React from 'react';
import { cn } from '@/utilities/ui';
import VideoCard, { VideoCardProps } from './VideoCard';

export interface VideoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  videos: Omit<VideoCardProps, 'onEdit' | 'onView' | 'onDelete'>[];
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const columnsStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

const gapStyles = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

export const VideoGrid: React.FC<VideoGridProps> = ({
  className,
  videos,
  columns = 3,
  gap = 'md',
  onEdit,
  onView,
  onDelete,
  ...props
}) => {
  if (!videos || videos.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No videos found.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid',
        columnsStyles[columns],
        gapStyles[gap],
        className
      )}
      {...props}
    >
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          {...video}
          onEdit={onEdit}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default VideoGrid;
