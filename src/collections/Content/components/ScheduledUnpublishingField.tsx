'use client'

import React from 'react'

interface ScheduledUnpublishingFieldProps {
  value?: string
}

const ScheduledUnpublishingField: React.FC<ScheduledUnpublishingFieldProps> = ({ value }) => {
  if (!value) return null
  
  return (
    <div className="p-2 bg-amber-50 text-amber-800 rounded-md text-sm mt-2">
      {value}
    </div>
  )
}

export default ScheduledUnpublishingField
