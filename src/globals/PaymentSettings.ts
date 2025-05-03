// src/globals/PaymentSettings.ts
import type { GlobalConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

const PaymentSettings: GlobalConfig = {
  slug: 'payment-settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'System Settings',
    description: 'Configure payment gateway settings for Stripe and PayPal integration',
  },
  fields: [
    {
      name: 'instructions',
      type: 'richText',
      admin: {
        description: 'Setup instructions for payment gateways',
      },
      defaultValue: [
        {
          children: [
            {
              text: 'Payment Gateway Setup Instructions',
              bold: true,
            },
          ],
        },
        {
          children: [
            {
              text: 'Configure your payment gateway settings below to enable payments on your platform.',
            },
          ],
        },
      ],
    },
    {
      name: 'stripe',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Stripe Payments',
          defaultValue: false,
        },
        {
          name: 'testMode',
          type: 'checkbox',
          label: 'Test Mode',
          defaultValue: true,
          admin: {
            description: 'When enabled, all transactions will use the Stripe test environment',
          },
        },
        {
          name: 'accountId',
          type: 'text',
          label: 'Stripe Account ID',
          admin: {
            description: 'Enter your Stripe Account ID',
          },
        },
        {
          name: 'connected',
          type: 'checkbox',
          label: 'Connected Status',
          defaultValue: false,
        },
        {
          name: 'apiKey',
          type: 'password',
          label: 'Stripe API Key',
          admin: {
            description: 'Enter your Stripe API Key (starts with sk_)',
            condition: (_, siblingData) => siblingData?.testMode === true,
          },
        },
        {
          name: 'liveApiKey',
          type: 'password',
          label: 'Stripe Live API Key',
          admin: {
            description: 'Enter your Stripe Live API Key (starts with sk_live_)',
            condition: (_, siblingData) => siblingData?.testMode === false,
          },
        },
        {
          name: 'publishableKey',
          type: 'text',
          label: 'Stripe Publishable Key',
          admin: {
            description: 'Enter your Stripe Publishable Key (starts with pk_)',
          },
        },
      ],
    },
    {
      name: 'paypal',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable PayPal Payments',
          defaultValue: false,
        },
        {
          name: 'testMode',
          type: 'checkbox',
          label: 'Test Mode',
          defaultValue: true,
          admin: {
            description: 'When enabled, all transactions will use the PayPal sandbox environment',
          },
          hooks: {
            afterChange: [
              ({ value, data, siblingData }) => {
                // Synchronize environment with testMode
                if (value === true && siblingData.environment !== 'sandbox') {
                  siblingData.environment = 'sandbox'
                } else if (value === false && siblingData.environment !== 'live') {
                  siblingData.environment = 'live'
                }
                return value
              },
            ],
          },
        },
        {
          name: 'environment',
          type: 'select',
          options: [
            { label: 'Sandbox', value: 'sandbox' },
            { label: 'Live', value: 'live' },
          ],
          defaultValue: 'sandbox',
          admin: {
            description: 'Select the PayPal environment to use',
            readOnly: true, // Make this read-only since it's controlled by testMode
          },
          hooks: {
            afterChange: [
              ({ value, siblingData }) => {
                // Synchronize testMode with environment
                if (value === 'sandbox' && siblingData.testMode !== true) {
                  siblingData.testMode = true
                } else if (value === 'live' && siblingData.testMode !== false) {
                  siblingData.testMode = false
                }
                return value
              },
            ],
          },
        },
        {
          name: 'clientId',
          type: 'text',
          label: 'PayPal Client ID',
          admin: {
            description: 'Enter your PayPal Client ID from the PayPal Developer Dashboard',
          },
        },
        {
          name: 'clientSecret',
          type: 'password',
          label: 'PayPal Client Secret',
          admin: {
            description: 'Enter your PayPal Client Secret from the PayPal Developer Dashboard',
          },
        },
        {
          name: 'connected',
          type: 'checkbox',
          label: 'Connected Status',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'activePaymentMethods',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'PayPal', value: 'paypal' },
      ],
      admin: {
        description: 'Select which payment methods to offer at checkout',
      },
    },
  ],
}

export default PaymentSettings
