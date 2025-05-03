'use client'

import React from 'react'
import { format } from 'date-fns'

interface PublishingStatusCellProps {
  rowData: {
    status?: string
    isPublished?: boolean
    publishAt?: string
    unpublishAt?: string
  }
}

const PublishingStatusCell: React.FC<PublishingStatusCellProps> = ({ rowData }) => {
  const { status, isPublished, publishAt, unpublishAt } = rowData
  const now = new Date()
  const publishDate = publishAt ? new Date(publishAt) : null
  const unpublishDate = unpublishAt ? new Date(unpublishAt) : null

  // Determine if the content is currently active
  const isActive =
    status === 'published' &&
    isPublished === true &&
    (!publishDate || publishDate <= now) &&
    (!unpublishDate || unpublishDate > now)

  // Determine if the content is scheduled to be published in the future
  const isScheduled =
    status === 'published' && isPublished === true && publishDate && publishDate > now

  // Determine if the content is expired
  const isExpired = status === 'published' && unpublishDate && unpublishDate <= now

  // Determine if the content is manually unpublished
  const isManuallyUnpublished = status === 'published' && isPublished === false

  // Determine the status text and color
  let statusText = 'Draft'
  let statusColor = 'bg-gray-200 text-gray-800'

  if (isActive) {
    statusText = 'Published'
    statusColor = 'bg-green-100 text-green-800'
  } else if (isScheduled) {
    statusText = `Scheduled for ${format(publishDate!, 'MMM d, yyyy h:mm a')}`
    statusColor = 'bg-blue-100 text-blue-800'
  } else if (isExpired) {
    statusText = `Expired on ${format(unpublishDate!, 'MMM d, yyyy h:mm a')}`
    statusColor = 'bg-red-100 text-red-800'
  } else if (isManuallyUnpublished) {
    statusText = 'Unpublished'
    statusColor = 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="flex flex-col">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
      >
        {statusText}
      </span>
      {publishDate && !isExpired && (
        <span className="text-xs text-gray-500 mt-1">
          {publishDate > now
            ? `Publishes on ${format(publishDate, 'MMM d, yyyy h:mm a')}`
            : `Published on ${format(publishDate, 'MMM d, yyyy h:mm a')}`}
        </span>
      )}
      {unpublishDate && (
        <span className="text-xs text-gray-500 mt-1">
          {unpublishDate > now
            ? `Expires on ${format(unpublishDate, 'MMM d, yyyy h:mm a')}`
            : `Expired on ${format(unpublishDate, 'MMM d, yyyy h:mm a')}`}
        </span>
      )}
    </div>
  )
}

export default PublishingStatusCell
