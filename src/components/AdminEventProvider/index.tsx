'use client'

import { clientLogger } from '@/utils/clientLogger';


import React, { useEffect, useState } from 'react'
import EventBridge from '@/components/EventProvider/EventBridge'
import { eventBus, EVENTS } from '@/utilities/eventBus'

export function AdminEventProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  // Log when component is mounted
  useEffect(() => {
    clientLogger.info('AdminEventProvider mounted', 'AdminEventProviderindex')
    setMounted(true)
    return () => {
      clientLogger.info('AdminEventProvider unmounted', 'AdminEventProviderindex')
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
