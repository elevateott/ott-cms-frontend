'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TestModeBadgeProps {
  gateway: 'stripe' | 'paypal'
  className?: string
}

const TestModeBadge: React.FC<TestModeBadgeProps> = ({ gateway, className = '' }) => {
  const label = gateway === 'stripe' ? 'Stripe Test Mode' : 'PayPal Sandbox Mode'
  
  return (
    <Badge 
      variant="outline" 
      className={`bg-yellow-50 text-yellow-800 border-yellow-300 hover:bg-yellow-100 ${className}`}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}

export default TestModeBadge
