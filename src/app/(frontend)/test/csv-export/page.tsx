'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function CSVExportTestPage() {
  const handleExportContent = () => {
    window.open('/api/export/content', '_blank')
  }

  const handleExportVideoAssets = () => {
    window.open('/api/export/videoassets', '_blank')
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">CSV Export Test Page</h1>
      
      <div className="space-y-8">
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Content Export</h2>
          <p className="mb-4 text-muted-foreground">
            Export all content items to a CSV file. This includes titles, descriptions, publishing status, and relationships.
          </p>
          <Button onClick={handleExportContent} className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export Content to CSV
          </Button>
        </div>
        
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Video Assets Export</h2>
          <p className="mb-4 text-muted-foreground">
            Export all video assets to a CSV file. This includes metadata, source types, and Mux-specific information.
          </p>
          <Button onClick={handleExportVideoAssets} className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export Video Assets to CSV
          </Button>
        </div>
        
        <div className="p-6 bg-muted rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Admin UI Integration</h2>
          <p className="mb-4">
            The export functionality is also available in the admin UI:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Go to the Content Library in the admin panel</li>
            <li>Look for the &quot;Export to CSV&quot; button above the list</li>
            <li>Click to download the current filtered view as CSV</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
