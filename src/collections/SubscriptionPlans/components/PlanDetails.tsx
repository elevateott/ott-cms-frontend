'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import ArchivePlanButton from './ArchivePlanButton'
import ClonePlanButton from './ClonePlanButton'

const PlanDetails: React.FC = () => {
  const { document } = useDocumentInfo()

  if (!document) {
    return <div>Loading plan details...</div>
  }

  const {
    name,
    description,
    price,
    pricesByCurrency,
    interval,
    trialPeriodDays,
    isActive,
    isDefault,
    stripePriceId,
    paypalPlanId,
    paymentProvider,
    createdAt,
    version,
  } = document

  // Format price from cents to dollars with currency symbol
  const formatPriceWithCurrency = (amount: number, currency: string) => {
    if (!amount) return 'N/A'

    const currencySymbols: Record<string, string> = {
      usd: '$',
      eur: '€',
      gbp: '£',
      cad: 'C$',
      aud: 'A$',
      jpy: '¥',
    }

    const symbol = currencySymbols[currency.toLowerCase()] || currency.toUpperCase()
    return `${symbol}${(amount / 100).toFixed(2)}`
  }

  // Legacy price format
  const formattedPrice = price ? `$${(price / 100).toFixed(2)}` : 'N/A'

  // Format interval
  const formatInterval = (interval: string) => {
    switch (interval) {
      case 'month':
        return 'Monthly'
      case 'quarter':
        return 'Quarterly'
      case 'semi-annual':
        return 'Semi-Annual'
      case 'year':
        return 'Yearly'
      default:
        return interval
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            margin: 0,
          }}
        >
          Subscription Plan Details
        </h2>

        <div style={{ display: 'flex', gap: '8px' }}>
          <ClonePlanButton />
          <ArchivePlanButton />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Plan Information
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Name</div>
            <div>{name || 'N/A'}</div>
          </div>
          {description && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>Description</div>
              <div>{description}</div>
            </div>
          )}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Prices</div>
            {pricesByCurrency && pricesByCurrency.length > 0 ? (
              <div>
                {pricesByCurrency.map((price, index) => (
                  <div
                    key={index}
                    style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '200px' }}
                  >
                    <span>{price.currency.toUpperCase()}</span>
                    <span>{formatPriceWithCurrency(price.amount, price.currency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>{formattedPrice} (USD)</div>
            )}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Billing Interval</div>
            <div>{formatInterval(interval)}</div>
          </div>
          {trialPeriodDays > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>Trial Period</div>
              <div>{trialPeriodDays} days</div>
            </div>
          )}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Created</div>
            <div>{formatDate(createdAt)}</div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Status & Integration
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Status</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '4px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#10b981' : '#ef4444',
                  marginRight: '8px',
                }}
              />
              <span>{isActive ? 'Active' : 'Archived'}</span>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Default Plan</div>
            <div>{isDefault ? 'Yes' : 'No'}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Version</div>
            <div>{version || 1}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Payment Provider</div>
            <div>
              {paymentProvider === 'all'
                ? 'All Providers'
                : paymentProvider === 'stripe'
                  ? 'Stripe Only'
                  : 'PayPal Only'}
            </div>
          </div>
          {stripePriceId && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>Stripe Price ID</div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  padding: '4px 8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflowX: 'auto',
                }}
              >
                {stripePriceId}
              </div>
            </div>
          )}
          {paypalPlanId && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>PayPal Plan ID</div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  padding: '4px 8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflowX: 'auto',
                }}
              >
                {paypalPlanId}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlanDetails
