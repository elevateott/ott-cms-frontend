'use client'

import React from 'react'
import Link from 'next/link'

const UploadWithMuxButton: React.FC = () => {
  return (
    <div className="mb-4">
      <Link 
        href="/admin/videos/upload" 
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Upload with Mux
      </Link>
    </div>
  )
}

export default UploadWithMuxButton
