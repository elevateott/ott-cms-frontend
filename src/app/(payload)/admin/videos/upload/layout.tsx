'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function VideoUploadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="p-4 w-full max-w-full" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Video Management</h1>

        <div className="flex mb-6 border-b">
          <Link
            href="/admin/collections/videos"
            className={`px-4 py-2 ${pathname.includes('/admin/collections/videos') && !pathname.includes('/upload') ? 'border-b-2 border-blue-500' : ''}`}
          >
            All Videos
          </Link>
          <Link
            href="/admin/videos/upload"
            className={`px-4 py-2 ${pathname.includes('/admin/videos/upload') ? 'border-b-2 border-blue-500' : ''}`}
          >
            Upload with Mux
          </Link>
        </div>
      </div>

      {children}
    </div>
  )
}
