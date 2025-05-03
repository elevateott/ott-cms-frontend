'use client'

import React from 'react'
import type { CustomComponent } from 'payload'
import type { UIFieldProps } from '@/types/UIFieldProps'

const PaymentInstructions: CustomComponent<UIFieldProps> = () => {
  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-md">
      <h3 className="text-lg font-medium mb-4">Payment Gateway Setup Instructions</h3>

      <div className="mb-4">
        <h4 className="font-medium mb-2">1. Stripe Setup</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            Connect your Stripe account using the OAuth button below
          </li>
          <li>
            After connecting, your Stripe Account ID will be automatically populated
          </li>
          <li>
            Toggle Test Mode to switch between test and live environments
          </li>
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">2. PayPal Setup</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            Go to{' '}
            <a
              href="https://developer.paypal.com/dashboard/applications/live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              PayPal Developer Dashboard
            </a>
          </li>
          <li>Create a new app and copy your Client ID and Secret</li>
          <li>Paste them into the fields below and click Verify Connection</li>
          <li>Toggle Test Mode to switch between sandbox and live environments</li>
        </ul>
      </div>

      <div>
        <h4 className="font-medium mb-2">3. Active Payment Methods</h4>
        <p>
          Select which payment methods to offer at checkout. You must have at least one payment method
          enabled and properly configured.
        </p>
      </div>
    </div>
  )
}

export default PaymentInstructions
