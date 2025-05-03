import React from 'react'
import ClientLoginWrapper from './ClientLoginWrapper'

/**
 * CustomLogin
 * 
 * This component wraps the default Payload login form in a client-side wrapper
 * to prevent hydration mismatches caused by browser extensions like LastPass.
 */
const CustomLogin: React.FC = () => {
  return (
    <ClientLoginWrapper>
      {/* The login form will be rendered by Payload inside this wrapper */}
      <div id="payload-login-form" />
    </ClientLoginWrapper>
  )
}

export default CustomLogin
