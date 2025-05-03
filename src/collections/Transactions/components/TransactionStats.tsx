'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from 'payload/components/utilities'

interface TransactionStats {
  total: number
  totalRevenue: number
  subscription: {
    count: number
    revenue: number
  }
  ppv: {
    count: number
    revenue: number
  }
  rental: {
    count: number
    revenue: number
  }
  last30Days: {
    count: number
    revenue: number
  }
}

const TransactionStats: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    totalRevenue: 0,
    subscription: {
      count: 0,
      revenue: 0,
    },
    ppv: {
      count: 0,
      revenue: 0,
    },
    rental: {
      count: 0,
      revenue: 0,
    },
    last30Days: {
      count: 0,
      revenue: 0,
    },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Fetch total transactions
        const totalRes = await fetch('/api/transactions?limit=0')
        const totalData = await totalRes.json()
        
        // Fetch subscription transactions
        const subscriptionRes = await fetch('/api/transactions?where[type][equals]=subscription&limit=0')
        const subscriptionData = await subscriptionRes.json()
        
        // Fetch PPV transactions
        const ppvRes = await fetch('/api/transactions?where[type][equals]=ppv&limit=0')
        const ppvData = await ppvRes.json()
        
        // Fetch rental transactions
        const rentalRes = await fetch('/api/transactions?where[type][equals]=rental&limit=0')
        const rentalData = await rentalRes.json()
        
        // Fetch transactions from the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const last30DaysRes = await fetch(`/api/transactions?where[createdAt][greater_than]=${thirtyDaysAgo.toISOString()}&limit=0`)
        const last30DaysData = await last30DaysRes.json()
        
        // Calculate revenue
        const calculateRevenue = async (docs) => {
          return docs.reduce((total, transaction) => total + (transaction.amount || 0), 0) / 100 // Convert cents to dollars
        }
        
        // Fetch all transactions to calculate revenue
        const allTransactionsRes = await fetch('/api/transactions?limit=999')
        const allTransactionsData = await allTransactionsRes.json()
        
        const subscriptionTransactions = allTransactionsData.docs.filter(t => t.type === 'subscription')
        const ppvTransactions = allTransactionsData.docs.filter(t => t.type === 'ppv')
        const rentalTransactions = allTransactionsData.docs.filter(t => t.type === 'rental')
        const last30DaysTransactions = allTransactionsData.docs.filter(t => {
          const createdAt = new Date(t.createdAt)
          return createdAt >= thirtyDaysAgo
        })
        
        const totalRevenue = await calculateRevenue(allTransactionsData.docs)
        const subscriptionRevenue = await calculateRevenue(subscriptionTransactions)
        const ppvRevenue = await calculateRevenue(ppvTransactions)
        const rentalRevenue = await calculateRevenue(rentalTransactions)
        const last30DaysRevenue = await calculateRevenue(last30DaysTransactions)
        
        setStats({
          total: totalData.totalDocs,
          totalRevenue,
          subscription: {
            count: subscriptionData.totalDocs,
            revenue: subscriptionRevenue,
          },
          ppv: {
            count: ppvData.totalDocs,
            revenue: ppvRevenue,
          },
          rental: {
            count: rentalData.totalDocs,
            revenue: rentalRevenue,
          },
          last30Days: {
            count: last30DaysData.totalDocs,
            revenue: last30DaysRevenue,
          },
        })
      } catch (error) {
        console.error('Error fetching transaction stats:', error)
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
      <div style={{ 
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        Loading transaction statistics...
      </div>
    )
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
      }}>
        Transaction Statistics
      </h2>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px',
      }}>
        <div style={{ 
          padding: '16px',
          backgroundColor: '#e0f2fe',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>
            {stats.total}
          </div>
          <div style={{ color: '#0369a1', marginBottom: '8px' }}>Total Transactions</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0369a1' }}>
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div style={{ color: '#0369a1' }}>Total Revenue</div>
        </div>
        
        <div style={{ 
          padding: '16px',
          backgroundColor: '#dcfce7',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534' }}>
            {stats.subscription.count}
          </div>
          <div style={{ color: '#166534', marginBottom: '8px' }}>Subscriptions</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534' }}>
            {formatCurrency(stats.subscription.revenue)}
          </div>
          <div style={{ color: '#166534' }}>Subscription Revenue</div>
        </div>
        
        <div style={{ 
          padding: '16px',
          backgroundColor: '#fef3c7',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
            {stats.ppv.count}
          </div>
          <div style={{ color: '#92400e', marginBottom: '8px' }}>PPV Purchases</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#92400e' }}>
            {formatCurrency(stats.ppv.revenue)}
          </div>
          <div style={{ color: '#92400e' }}>PPV Revenue</div>
        </div>
        
        <div style={{ 
          padding: '16px',
          backgroundColor: '#dbeafe',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
            {stats.rental.count}
          </div>
          <div style={{ color: '#1e40af', marginBottom: '8px' }}>Rentals</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e40af' }}>
            {formatCurrency(stats.rental.revenue)}
          </div>
          <div style={{ color: '#1e40af' }}>Rental Revenue</div>
        </div>
      </div>
      
      <div style={{ 
        padding: '16px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        textAlign: 'center',
        marginTop: '16px',
      }}>
        <h3 style={{ 
          fontSize: '1rem',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#0c4a6e',
        }}>
          Last 30 Days
        </h3>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-around',
        }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
              {stats.last30Days.count}
            </div>
            <div style={{ color: '#0c4a6e' }}>Transactions</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0c4a6e' }}>
              {formatCurrency(stats.last30Days.revenue)}
            </div>
            <div style={{ color: '#0c4a6e' }}>Revenue</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionStats
