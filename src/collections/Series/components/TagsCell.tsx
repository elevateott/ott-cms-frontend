'use client'
import React from 'react'

// Define the props for the TagsCell component
type TagsCellProps = {
  rowData: {
    tags?: Array<{ value: string }>
  }
}

// Component to display tags as pills in the admin UI
export const TagsCell: React.FC<TagsCellProps> = ({ rowData }) => {
  const tags = rowData.tags || []

  if (tags.length === 0) {
    return <span className="text-gray-400">No tags</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag, index) => (
        <span
          key={`${tag.value}-${index}`}
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {tag.value}
        </span>
      ))}
    </div>
  )
}

export default TagsCell
