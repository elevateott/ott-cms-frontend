'use client'

import React from 'react'
import EventBridge from './EventBridge'
import { Toaster } from '@/components/ui/toaster'

const ClientProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <EventBridge />
    {children}
    <Toaster />
  </>
)

export default ClientProviders
