'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface TestModeWarningProps {
  gateways: Array<'stripe' | 'paypal'>
  className?: string
}

const TestModeWarning: React.FC<TestModeWarningProps> = ({ gateways, className = '' }) => {
  if (gateways.length === 0) return null
  
  const gatewayLabels = {
    stripe: 'Stripe',
    paypal: 'PayPal'
  }
  
  const gatewayList = gateways.map(g => gatewayLabels[g]).join(' and ')
  
  return (
    <Alert 
      variant="warning" 
      className={`bg-yellow-50 border-yellow-200 ${className}`}
    >
      <AlertTriangle className="h-4 w-4 text-yellow-800" />
      <AlertTitle className="text-yellow-800 font-medium">Test Mode Active</AlertTitle>
      <AlertDescription className="text-yellow-700">
        {gateways.length === 1 
          ? `${gatewayList} is currently in test mode. No real payments will be processed.` 
          : `${gatewayList} are currently in test mode. No real payments will be processed.`
        }
        <br />
        <span className="text-sm mt-1 block">
          Remember to disable test mode before processing real payments in production.
        </span>
      </AlertDescription>
    </Alert>
  )
}

export default TestModeWarning
