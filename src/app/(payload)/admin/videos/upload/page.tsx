'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VideoUploadPage() {
  const router = useRouter()

  // Redirect to the new location
  useEffect(() => {
    router.replace('/admin/collections/videos')
  }, [router])

  // Return null or a loading indicator while redirecting
  return null
}
