'use client'

import React from 'react'
import VideoAdmin from '@/collections/Videos/components/VideoAdmin'
import WebhookNote from './WebhookNote'

// This component will be used as a custom component before the list view
// It will completely replace the default list view functionality
export default function VideosListView() {
  return (
    <div className="p-4 w-full">
      <WebhookNote />
      <VideoAdmin className="w-full" />
      {/* Hide the default list view */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .collection-list {
          display: none !important;
        }
      `,
        }}
      />
    </div>
  )
}
