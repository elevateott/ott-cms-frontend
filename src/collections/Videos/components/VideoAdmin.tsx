'use client'

import React, { useState, useCallback } from 'react'
import VideoUploader from './VideoUploader'
import VideoList from './VideoList'

const VideoAdmin: React.FC = () => {
  const [uploadType, setUploadType] = useState<'mux' | 'embedded'>('mux')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefreshList = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Add New Video</h1>
        
        <div className="mb-6">
          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 flex-1 ${uploadType === 'mux' ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => setUploadType('mux')}
            >
              Mux
            </button>
            <button
              className={`px-4 py-2 flex-1 ${uploadType === 'embedded' ? 'bg-blue-500 text-white' : 'bg-white'}`}
              onClick={() => setUploadType('embedded')}
            >
              Embedded
            </button>
          </div>
        </div>

        {uploadType === 'mux' ? (
          <VideoUploader refreshList={handleRefreshList} />
        ) : (
          <div className="p-4 border rounded-lg bg-gray-50">
            <p>Embedded selected.</p>
            <p className="text-sm text-gray-500 mt-2">
              To add an embedded video, please use the standard form below.
            </p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Videos</h2>
        <VideoList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}

export default VideoAdmin
