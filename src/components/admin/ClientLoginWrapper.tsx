'use client'

import React, { useEffect, useState } from 'react'

/**
 * ClientLoginWrapper
 * 
 * This component wraps the login form to ensure it's fully rendered on the client side,
 * preventing hydration mismatches caused by browser extensions like LastPass.
 */
const ClientLoginWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use state to control when to render the children
  const [isMounted, setIsMounted] = useState(false)

  // Only render children after component has mounted on the client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Show nothing during SSR or initial client render
  if (!isMounted) {
    return <div className="login-form-placeholder" style={{ minHeight: '300px' }} />
  }

  // Once mounted on the client, render the actual children
  return <>{children}</>
}

export default ClientLoginWrapper
