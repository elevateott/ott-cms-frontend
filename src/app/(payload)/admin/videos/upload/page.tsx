'use client'

import React from 'react'
import VideoAdmin from '@/collections/Videos/components/VideoAdmin'
import WebhookNote from './WebhookNote'

export default function VideoUploadPage() {
  return (
    <div className="p-4">
      <WebhookNote />
      <VideoAdmin />
    </div>
  )
}
