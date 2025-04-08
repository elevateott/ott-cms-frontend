'use client'

import React from 'react'

const UploadButton: React.FC = () => {
  return (
    <div className="mb-4">
      <a 
        href="/admin/videos/upload" 
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Upload with Mux
      </a>
    </div>
  )
}

export default UploadButton
