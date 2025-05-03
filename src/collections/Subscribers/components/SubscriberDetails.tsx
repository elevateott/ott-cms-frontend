'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const SubscriberDetails: React.FC = () => {
  const { document } = useDocumentInfo()
  
  if (!document) {
    return <div>Loading subscriber details...</div>
  }
  
  const {
    fullName,
    email,
    paymentProvider,
    paymentProviderCustomerId,
    subscriptionStatus,
    subscriptionExpiresAt,
    activePlans,
    purchasedRentals,
    purchasedPPV,
    createdAt,
  } = document
  
  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  // Define status colors
  const statusColors = {
    active: '#10b981',
    trialing: '#f59e0b',
    past_due: '#ef4444',
    canceled: '#6b7280',
    none: '#6b7280',
  }
  
  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      <h2 style={{ 
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '16px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '8px',
      }}>
        Subscriber Summary
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Account Information
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Name</div>
            <div>{fullName || 'N/A'}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Email</div>
            <div>{email || 'N/A'}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Created</div>
            <div>{formatDate(createdAt)}</div>
          </div>
        </div>
        
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Payment Information
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Payment Provider</div>
            <div>{paymentProvider || 'N/A'}</div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>Customer ID</div>
            <div style={{ 
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              padding: '4px 8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflowX: 'auto',
            }}>
              {paymentProviderCustomerId || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
          Subscription Status
        </h3>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <span style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: statusColors[subscriptionStatus] || statusColors.none,
            marginRight: '8px',
          }} />
          <span style={{ 
            fontWeight: 'bold',
            color: statusColors[subscriptionStatus] || statusColors.none,
          }}>
            {subscriptionStatus || 'None'}
          </span>
          {subscriptionExpiresAt && (
            <span style={{ marginLeft: '12px' }}>
              Expires: {formatDate(subscriptionExpiresAt)}
            </span>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Active Plans
          </h3>
          {activePlans && activePlans.length > 0 ? (
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              {activePlans.map((plan, index) => (
                <li key={index}>{plan.name || plan.id}</li>
              ))}
            </ul>
          ) : (
            <div style={{ color: '#6b7280' }}>No active plans</div>
          )}
        </div>
        
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Purchased Rentals
          </h3>
          {purchasedRentals && purchasedRentals.length > 0 ? (
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              {purchasedRentals.map((rental, index) => (
                <li key={index}>{rental.title || rental.id}</li>
              ))}
            </ul>
          ) : (
            <div style={{ color: '#6b7280' }}>No rentals</div>
          )}
        </div>
        
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Purchased PPV
          </h3>
          {purchasedPPV && purchasedPPV.length > 0 ? (
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
              {purchasedPPV.map((ppv, index) => (
                <li key={index}>{ppv.title || ppv.id}</li>
              ))}
            </ul>
          ) : (
            <div style={{ color: '#6b7280' }}>No PPV events</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SubscriberDetails
