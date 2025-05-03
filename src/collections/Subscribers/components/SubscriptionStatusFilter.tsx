'use client'

import React, { useCallback } from 'react'
import { useFilter } from 'payload/components/utilities'
import { Where } from 'payload/types'

const SubscriptionStatusFilter: React.FC = () => {
  const { filter, modifySearchQuery, getResults } = useFilter({
    key: 'subscriptionStatus',
  })

  const handleChange = useCallback(
    (status: string) => {
      const newFilter: Where = {
        subscriptionStatus: {
          equals: status,
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
    [filter, modifySearchQuery, getResults]
  )

  const statuses = [
    { value: 'active', label: 'Active', color: '#10b981' },
    { value: 'trialing', label: 'Trial', color: '#f59e0b' },
    { value: 'past_due', label: 'Past Due', color: '#ef4444' },
    { value: 'canceled', label: 'Canceled', color: '#6b7280' },
    { value: 'none', label: 'None', color: '#6b7280' },
  ]

  const activeStatus = filter?.subscriptionStatus?.equals || ''

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ 
        fontSize: '0.875rem',
        fontWeight: 'bold',
        marginBottom: '8px',
      }}>
        Filter by Status
      </h3>
      <div style={{ 
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => handleChange(status.value)}
            style={{ 
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: activeStatus === status.value ? status.color : '#e5e7eb',
              backgroundColor: activeStatus === status.value ? status.color : 'transparent',
              color: activeStatus === status.value ? 'white' : status.color,
              fontSize: '0.875rem',
              fontWeight: activeStatus === status.value ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            {status.label}
          </button>
        ))}
        {activeStatus && (
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

export default SubscriptionStatusFilter
