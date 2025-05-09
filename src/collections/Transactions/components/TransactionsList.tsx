'use client'

import React from 'react'
import TransactionStats from './TransactionStats'
import TransactionTypeFilter from './TransactionTypeFilter'

const TransactionsList: React.FC = () => {
  return (
    <div>
      <TransactionStats />
      <TransactionTypeFilter />
    </div>
  )
}

export default TransactionsList
