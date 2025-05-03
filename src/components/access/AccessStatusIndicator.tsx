'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, Lock } from 'lucide-react'

interface AccessStatusIndicatorProps {
  /**
   * Whether the user has access to the content
   */
  hasAccess: boolean
  
  /**
   * Optional className for styling
   */
  className?: string
}

/**
 * A component that displays the user's access status
 */
export const AccessStatusIndicator: React.FC<AccessStatusIndicatorProps> = ({
  hasAccess,
  className = '',
}) => {
  if (hasAccess) {
    return (
      <Alert className={`bg-green-50 border-green-200 text-green-800 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle>Access Granted</AlertTitle>
        <AlertDescription>
          You have access to this content. Enjoy!
        </AlertDescription>
      </Alert>
    )
  }
  
  return (
    <Alert className={`bg-amber-50 border-amber-200 text-amber-800 ${className}`}>
      <Lock className="h-4 w-4 text-amber-600" />
      <AlertTitle>Access Required</AlertTitle>
      <AlertDescription>
        This content requires access. Please choose an option below.
      </AlertDescription>
    </Alert>
  )
}

export default AccessStatusIndicator
