'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

const PaymentProviderCell: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const provider = cellData || 'unknown'
  
  // Define icons or colors for different payment providers
  const providerIcons = {
    stripe: '💳', // Credit card emoji for Stripe
    paypal: '🅿️', // PayPal emoji
    unknown: '❓', // Question mark for unknown
  }
  
  // Define labels for better readability
  const providerLabels = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    unknown: 'Unknown',
  }
  
  const icon = providerIcons[provider] || providerIcons.unknown
  const label = providerLabels[provider] || providerLabels.unknown
  
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: '8px', fontSize: '16px' }}>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

export default PaymentProviderCell
