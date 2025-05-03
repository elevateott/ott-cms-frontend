'use client'

import React from 'react'
import { DefaultList } from 'payload/components/views/List'
import TransactionStats from './TransactionStats'
import TransactionTypeFilter from './TransactionTypeFilter'

const TransactionsList: React.FC = () => {
  return (
    <div>
      <TransactionStats />
      <TransactionTypeFilter />
      <DefaultList />
    </div>
  )
}

export default TransactionsList
