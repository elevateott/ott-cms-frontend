'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'

type ExportButtonProps = {
  collection: string
  label?: string
  className?: string
}

const ExportButton: React.FC<ExportButtonProps> = ({
  collection,
  label = 'Export to CSV',
  className = '',
}) => {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Open the export endpoint in a new tab
      window.open(`/api/export/${collection}`, '_blank')
    } catch (error) {
      clientLogger.error('Error exporting data:', error, 'ExportButton')
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => {
        setIsExporting(false)
      }, 1000)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : label}
    </Button>
  )
}

export default ExportButton
