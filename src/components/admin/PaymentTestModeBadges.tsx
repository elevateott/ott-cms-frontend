'use client'

import React, { useEffect, useState } from 'react'
import { clientLogger } from '@/utils/clientLogger'
import { API_ROUTES } from '@/constants/api'
import TestModeBadge from './TestModeBadge'

const PaymentTestModeBadges: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [testModeGateways, setTestModeGateways] = useState<Array<'stripe' | 'paypal'>>([])
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(API_ROUTES.PAYMENTS.TEST)
        const data = await response.json()
        
        if (data.success) {
          setTestModeGateways(data.settings.testMode.gateways || [])
        }
      } catch (err: any) {
        clientLogger.error(err, 'PaymentTestModeBadges')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSettings()
  }, [])
  
  if (loading || testModeGateways.length === 0) {
    return null
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {testModeGateways.includes('stripe') && (
        <TestModeBadge gateway="stripe" />
      )}
      {testModeGateways.includes('paypal') && (
        <TestModeBadge gateway="paypal" />
      )}
    </div>
  )
}

export default PaymentTestModeBadges
