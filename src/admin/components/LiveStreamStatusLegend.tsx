'use client'

import React from 'react'

/**
 * LiveStreamStatusLegend
 *
 * A component to display a legend for the live stream status badges in the Payload CMS admin
 */
const LiveStreamStatusLegend: React.FC = () => {
  // Define the statuses and their colors
  const statuses = [
    { label: 'Active', color: '#2ecc71', description: 'Currently live and broadcasting' },
    { label: 'Idle', color: '#f39c12', description: 'Waiting to go live' },
    { label: 'Disabled', color: '#e74c3c', description: 'Stream temporarily disabled' },
    { label: 'Completed', color: '#95a5a6', description: 'Broadcast ended' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px',
        marginBottom: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #e9ecef',
      }}
    >
      <div style={{ fontWeight: 'bold', marginRight: '8px' }}>Status Legend:</div>
      {statuses.map((status) => (
        <div key={status.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: status.color,
              borderRadius: '50%',
            }}
          />
          <div>
            <span style={{ fontWeight: 'bold' }}>{status.label}</span>
            <span style={{ marginLeft: '4px', fontSize: '12px', color: '#6c757d' }}>
              ({status.description})
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LiveStreamStatusLegend
