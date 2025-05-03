'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from 'payload/components/utilities'

interface SubscriberStats {
  total: number
  active: number
  trialing: number
  pastDue: number
  canceled: number
  none: number
  withPPV: number
  withRentals: number
  withManualAccess: number
  newLast30Days: number
}

const SubscriberStats: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<SubscriberStats>({
    total: 0,
    active: 0,
    trialing: 0,
    pastDue: 0,
    canceled: 0,
    none: 0,
    withPPV: 0,
    withRentals: 0,
    withManualAccess: 0,
    newLast30Days: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Fetch total subscribers
        const totalRes = await fetch('/api/subscribers?limit=0')
        const totalData = await totalRes.json()

        // Fetch active subscribers
        const activeRes = await fetch(
          '/api/subscribers?where[subscriptionStatus][equals]=active&limit=0',
        )
        const activeData = await activeRes.json()

        // Fetch trialing subscribers
        const trialingRes = await fetch(
          '/api/subscribers?where[subscriptionStatus][equals]=trialing&limit=0',
        )
        const trialingData = await trialingRes.json()

        // Fetch past_due subscribers
        const pastDueRes = await fetch(
          '/api/subscribers?where[subscriptionStatus][equals]=past_due&limit=0',
        )
        const pastDueData = await pastDueRes.json()

        // Fetch canceled subscribers
        const canceledRes = await fetch(
          '/api/subscribers?where[subscriptionStatus][equals]=canceled&limit=0',
        )
        const canceledData = await canceledRes.json()

        // Fetch none subscribers
        const noneRes = await fetch(
          '/api/subscribers?where[subscriptionStatus][equals]=none&limit=0',
        )
        const noneData = await noneRes.json()

        // Fetch subscribers with PPV purchases
        const withPPVRes = await fetch('/api/subscribers?where[purchasedPPV][exists]=true&limit=0')
        const withPPVData = await withPPVRes.json()

        // Fetch subscribers with rentals
        const withRentalsRes = await fetch(
          '/api/subscribers?where[purchasedRentals][exists]=true&limit=0',
        )
        const withRentalsData = await withRentalsRes.json()

        // Fetch subscribers with manual access
        const withManualAccessRes = await fetch(
          '/api/subscribers?where[hasManualSubscription][equals]=true&limit=0',
        )
        const withManualAccessData = await withManualAccessRes.json()

        // Fetch new subscribers in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const newLast30DaysRes = await fetch(
          `/api/subscribers?where[createdAt][greater_than]=${thirtyDaysAgo.toISOString()}&limit=0`,
        )
        const newLast30DaysData = await newLast30DaysRes.json()

        setStats({
          total: totalData.totalDocs,
          active: activeData.totalDocs,
          trialing: trialingData.totalDocs,
          pastDue: pastDueData.totalDocs,
          canceled: canceledData.totalDocs,
          none: noneData.totalDocs,
          withPPV: withPPVData.totalDocs,
          withRentals: withRentalsData.totalDocs,
          withManualAccess: withManualAccessData.totalDocs,
          newLast30Days: newLast30DaysData.totalDocs,
        })
      } catch (error) {
        console.error('Error fetching subscriber stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  if (loading) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        Loading subscriber statistics...
      </div>
    )
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
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}
      >
        Subscriber Statistics
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: '#e0f2fe',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>
            {stats.total}
          </div>
          <div style={{ color: '#0369a1' }}>Total Subscribers</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#dcfce7',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534' }}>
            {stats.active}
          </div>
          <div style={{ color: '#166534' }}>Active</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
            {stats.trialing}
          </div>
          <div style={{ color: '#92400e' }}>Trial</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b91c1c' }}>
            {stats.pastDue}
          </div>
          <div style={{ color: '#b91c1c' }}>Past Due</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4b5563' }}>
            {stats.canceled}
          </div>
          <div style={{ color: '#4b5563' }}>Canceled</div>
        </div>
      </div>

      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 'bold',
          marginBottom: '12px',
          marginTop: '24px',
        }}
      >
        Purchase Activity
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
            {stats.withPPV}
          </div>
          <div style={{ color: '#92400e' }}>With PPV Purchases</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#dbeafe',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
            {stats.withRentals}
          </div>
          <div style={{ color: '#1e40af' }}>With Rentals</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#f0fdfa',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f766e' }}>
            {stats.withManualAccess}
          </div>
          <div style={{ color: '#0f766e' }}>With Manual Access</div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#fdf2f8',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9d174d' }}>
            {stats.newLast30Days}
          </div>
          <div style={{ color: '#9d174d' }}>New (Last 30 Days)</div>
        </div>
      </div>
    </div>
  )
}

export default SubscriberStats
