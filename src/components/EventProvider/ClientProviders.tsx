'use client'

import React from 'react'
import EventBridge from './EventBridge'

const ClientProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <EventBridge />
    {children}
  </>
)

export default ClientProviders