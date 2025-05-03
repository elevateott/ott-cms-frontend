'use client'

import React, { useState } from 'react'
import { AddOnUpsell } from '@/components/addons/AddOnUpsell'
import { Button } from '@/components/ui/button'

export default function UpsellTestPage() {
  const [showUpsell, setShowUpsell] = useState(false)
  
  // Example add-on data
  const exampleAddOn = {
    id: 'example-addon',
    title: 'Premium Content Access',
    description: 'Get exclusive access to premium content including behind-the-scenes videos and bonus material.',
    type: 'one-time' as const,
    pricesByCurrency: [
      { currency: 'usd', amount: 1999 }, // $19.99
      { currency: 'eur', amount: 1799 }, // €17.99
      { currency: 'gbp', amount: 1599 }, // £15.99
    ],
  }
  
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-8">Upsell Test Page</h1>
      
      <div className="mb-8">
        <p className="mb-4">
          This page demonstrates how to use the AddOnUpsell component to show post-purchase upsells.
        </p>
        
        <Button onClick={() => setShowUpsell(!showUpsell)}>
          {showUpsell ? 'Hide Upsell' : 'Show Upsell'}
        </Button>
      </div>
      
      {showUpsell && (
        <div className="max-w-md mx-auto">
          <AddOnUpsell 
            addon={exampleAddOn}
            onDismiss={() => setShowUpsell(false)}
            onSuccess={() => {
              alert('Purchase successful!')
              setShowUpsell(false)
            }}
          />
        </div>
      )}
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Implementation Example</h2>
        
        <p className="mb-4">
          You can use the AddOnUpsell component in various places:
        </p>
        
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>After a user completes a subscription purchase</li>
          <li>After a user completes a PPV or rental purchase</li>
          <li>On the account page for users who haven't purchased certain add-ons</li>
          <li>As a modal that appears after a certain amount of content consumption</li>
        </ul>
        
        <p>
          The component is designed to be flexible and can be used in any context where you want to offer an add-on purchase.
        </p>
      </div>
    </div>
  )
}
