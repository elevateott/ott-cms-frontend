'use client'

import React from 'react'
import ExportButton from '@/components/admin/ExportButton'

const ExportButtonBar: React.FC = () => {
  return (
    <div
      className="export-button-bar"
      style={{
        marginBottom: '1rem',
        marginRight: '1rem',
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
      }}
    >
      <ExportButton collection="content" />
    </div>
  )
}

export default ExportButtonBar
