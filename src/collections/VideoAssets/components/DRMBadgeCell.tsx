'use client'

import React, { useEffect, useState } from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { clientLogger } from '@/utils/clientLogger'
import { ShieldCheck } from 'lucide-react'
import SimpleTooltip from '@/components/ui/simple-tooltip'

const DRMBadgeCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const [globalDRMEnabled, setGlobalDRMEnabled] = useState(false)

  // Fetch global DRM settings on component mount
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const response = await fetch('/api/globals/streaming-settings')
        if (response.ok) {
          const data = await response.json()
          const muxSettings = data.muxSettings || {}
          setGlobalDRMEnabled(muxSettings.enableDRMByDefault || false)
        }
      } catch (error) {
        clientLogger.error('Error fetching global DRM settings', 'DRMBadgeCell', error)
      }
    }

    fetchGlobalSettings()
  }, [])

  // Only show for Mux videos
  if (rowData.sourceType !== 'mux') {
    return null
  }

  // Determine if DRM is enabled for this video
  const isDRMEnabled =
    rowData.useDRM || (rowData.overrideDRM === false && globalDRMEnabled === true)

  if (!isDRMEnabled) {
    return null
  }

  // Determine if using global or custom DRM settings
  const isUsingGlobalSettings = rowData.overrideDRM === false

  return (
    <SimpleTooltip
      content={isUsingGlobalSettings ? 'Using global DRM settings' : 'Using custom DRM settings'}
    >
      <div
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          isUsingGlobalSettings ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
        }`}
      >
        <ShieldCheck className="h-3 w-3 mr-1" />
        <span>DRM</span>
      </div>
    </SimpleTooltip>
  )
}

export default DRMBadgeCell
