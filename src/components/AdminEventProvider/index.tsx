'use client'

import React, { useEffect, useState } from 'react'
import EventBridge from '@/components/EventProvider/EventBridge'
import { eventBus, EVENTS } from '@/utilities/eventBus'

export function AdminEventProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  // Log when component is mounted
  useEffect(() => {
    console.log('AdminEventProvider mounted')
    setMounted(true)
    return () => {
      console.log('AdminEventProvider unmounted')
      setMounted(false)
    }
  }, [])

  return (
    <>
      {mounted && <EventBridge />}
      {children}
    </>
  )
}

export default AdminEventProvider
