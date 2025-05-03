'use client'

import React from 'react'

interface ManualPublishingNoteFieldProps {
  value?: string
}

const ManualPublishingNoteField: React.FC<ManualPublishingNoteFieldProps> = ({ value }) => {
  if (!value) return null
  
  return (
    <div className="p-2 bg-yellow-50 text-yellow-800 rounded-md text-sm mt-2">
      {value}
    </div>
  )
}

export default ManualPublishingNoteField
