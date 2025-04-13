'use client'

import React from 'react'
import VideoAdmin from '@/collections/Videos/components/VideoAdmin'
import WebhookNote from './WebhookNote'

export default function VideosCollectionPage() {
  return (
    <div className="p-4 w-full">
      <WebhookNote />
      <VideoAdmin className="w-full" />
    </div>
  )
}
