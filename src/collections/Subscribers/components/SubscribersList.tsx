'use client'

import React from 'react'
import { DefaultList } from 'payload/components/views/List'
import SubscriptionStatusFilter from './SubscriptionStatusFilter'
import SubscriberStats from './SubscriberStats'

const SubscribersList: React.FC = () => {
  return (
    <div>
      <SubscriberStats />

      <SubscriptionStatusFilter />

      <DefaultList />
    </div>
  )
}

export default SubscribersList
