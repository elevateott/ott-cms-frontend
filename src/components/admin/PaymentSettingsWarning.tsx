'use client'

import React, { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'
import { API_ROUTES } from '@/constants/api'
import TestModeWarning from './TestModeWarning'

const PaymentSettingsWarning: React.FC = () => {
  const { toast } = useToast()
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
        } else {
          throw new Error(data.error || 'Failed to fetch payment settings')
        }
      } catch (err: any) {
        clientLogger.error(err, 'PaymentSettingsWarning')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSettings()
  }, [])
  
  if (loading || testModeGateways.length === 0) {
    return null
  }
  
  return <TestModeWarning gateways={testModeGateways} />
}

export default PaymentSettingsWarning
