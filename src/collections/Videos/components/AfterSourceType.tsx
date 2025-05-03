'use client'

import React from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import MuxUploaderField from './MuxUploaderField'

const AfterSourceType: React.FC = () => {
  // Get the current value of the sourceType field
  const sourceTypeField = useFormFields(([fields]) => fields.sourceType)
  const sourceType = sourceTypeField?.value

  if (sourceType === 'mux') {
    return <MuxUploaderField path="muxData" label="Upload Video to Mux" />
  }

  return null
}

export default AfterSourceType
