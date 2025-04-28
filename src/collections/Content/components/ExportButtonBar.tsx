'use client'

import React from 'react'
import ExportButton from '@/components/admin/ExportButton'

const ExportButtonBar: React.FC = () => {
  return (
    <div className="export-button-bar" style={{ marginBottom: '1rem' }}>
      <ExportButton collection="content" />
    </div>
  )
}

export default ExportButtonBar
