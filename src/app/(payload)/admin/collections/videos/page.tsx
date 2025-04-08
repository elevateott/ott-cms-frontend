'use client'

import React from 'react'
import UploadWithMuxButton from './UploadWithMuxButton'

export default function VideosCollectionPage() {
  return (
    <div className="mb-4">
      <UploadWithMuxButton />
      {/* The rest of the page will be rendered by Payload */}
    </div>
  )
}
