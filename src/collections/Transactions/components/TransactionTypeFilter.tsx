'use client'

import React, { useCallback } from 'react'
import { useFilter } from '@payloadcms/ui'
import type { Where } from 'payload'

const TransactionTypeFilter: React.FC = () => {
  const { filter, modifySearchQuery, getResults } = useFilter({
    key: 'type',
  })

  const handleChange = useCallback(
    (type: string) => {
      const newFilter: Where = {
        type: {
          equals: type,
        },
      }

      modifySearchQuery({
        filter: {
          ...filter,
          ...newFilter,
        },
      })

      getResults()
    },
    [filter, modifySearchQuery, getResults],
  )

  const types = [
    { value: 'subscription', label: 'Subscriptions', color: '#10b981' },
    { value: 'ppv', label: 'Pay-Per-View', color: '#f59e0b' },
    { value: 'rental', label: 'Rentals', color: '#3b82f6' },
  ]

  const activeType = filter?.type?.equals || ''

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3
        style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          marginBottom: '8px',
        }}
      >
        Filter by Transaction Type
      </h3>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {types.map((type) => (
          <button
            key={type.value}
            onClick={() => handleChange(type.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: activeType === type.value ? type.color : '#e5e7eb',
              backgroundColor: activeType === type.value ? type.color : 'transparent',
              color: activeType === type.value ? 'white' : type.color,
              fontSize: '0.875rem',
              fontWeight: activeType === type.value ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            {type.label}
          </button>
        ))}
        {activeType && (
          <button
            onClick={() => handleChange('')}
            style={{
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'transparent',
              color: '#6b7280',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default TransactionTypeFilter
