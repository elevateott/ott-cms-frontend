'use client'

import React from 'react'

interface ScheduledPublishingFieldProps {
  value?: string
}

const ScheduledPublishingField: React.FC<ScheduledPublishingFieldProps> = ({ value }) => {
  if (!value) return null
  
  return (
    <div className="p-2 bg-blue-50 text-blue-800 rounded-md text-sm mt-2">
      {value}
    </div>
  )
}

export default ScheduledPublishingField
