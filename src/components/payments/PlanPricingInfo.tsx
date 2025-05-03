'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'

interface PlanPricingInfoProps {
  price: number // in cents
  interval: 'month' | 'quarter' | 'semi-annual' | 'year'
  trialPeriodDays?: number
  setupFeeAmount?: number
  className?: string
}

const PlanPricingInfo: React.FC<PlanPricingInfoProps> = ({
  price,
  interval,
  trialPeriodDays = 0,
  setupFeeAmount = 0,
  className = '',
}) => {
  // Format price from cents to dollars
  const formattedPrice = `$${(price / 100).toFixed(2)}`
  
  // Format setup fee from cents to dollars
  const formattedSetupFee = setupFeeAmount > 0 ? `$${(setupFeeAmount / 100).toFixed(2)}` : null
  
  // Format interval for display
  const getIntervalLabel = () => {
    switch (interval) {
      case 'month':
        return 'monthly'
      case 'quarter':
        return 'quarterly'
      case 'semi-annual':
        return 'semi-annually'
      case 'year':
        return 'yearly'
      default:
        return interval
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{formattedPrice}</span>
        <span className="text-sm text-gray-500">/{getIntervalLabel()}</span>
      </div>
      
      {trialPeriodDays > 0 && (
        <div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {trialPeriodDays}-day {setupFeeAmount > 0 ? 'paid' : 'free'} trial
          </Badge>
        </div>
      )}
      
      {setupFeeAmount > 0 && (
        <div className="text-sm text-gray-600">
          {formattedSetupFee} setup fee {trialPeriodDays > 0 ? 'charged today' : ''}
        </div>
      )}
      
      {trialPeriodDays > 0 && (
        <div className="text-sm text-gray-600">
          {setupFeeAmount > 0 
            ? `Regular billing starts after trial`
            : `No charge for ${trialPeriodDays} days`}
        </div>
      )}
    </div>
  )
}

export default PlanPricingInfo
