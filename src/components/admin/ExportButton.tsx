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

      // Create a hidden iframe to handle the download
      // This approach works better than window.open for file downloads
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      document.body.appendChild(iframe)

      // Set the iframe source to the export endpoint
      iframe.src = `/api/export/${collection}`

      // Log the export attempt
      clientLogger.info(`Exporting ${collection} to CSV`, 'ExportButton', { collection })

      // Remove the iframe after a delay
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
        setIsExporting(false)
      }, 2000)
    } catch (error) {
      clientLogger.error('Error exporting data:', 'ExportButton', {
        error: error instanceof Error ? error.message : String(error),
      })
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className={`px-3 py-1 ${className}`}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Exporting...' : label}
    </Button>
  )
}

export default ExportButton
