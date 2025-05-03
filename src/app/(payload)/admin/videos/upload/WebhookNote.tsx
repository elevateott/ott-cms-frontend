'use client'

import React from 'react'

const WebhookNote: React.FC = () => {
  return (
    <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-medium mb-2">Webhook Configuration</h3>
      <p className="text-sm text-gray-700 mb-2">
        For Mux webhooks to work properly, make sure your smee.io proxy is configured to forward to:
      </p>
      <code className="block p-2 bg-gray-100 rounded text-sm mb-2">
        http://localhost:3000/api/mux/webhook
      </code>
      <p className="text-sm text-gray-700 mb-2">
        Make sure your Mux webhook is configured with the correct webhook secret:
      </p>
      <code className="block p-2 bg-gray-100 rounded text-sm mb-2">
        {/* We can't access process.env directly in client components */}
        {/* For security reasons, we'll just show a placeholder */}
        ******* (configured in .env file)
      </code>
      <p className="text-sm text-gray-700">
        If you&apos;re seeing 401 errors, check that the webhook secret in your Mux dashboard matches the
        one in your .env file (MUX_WEBHOOK_SECRET).
      </p>
      <p>
        Don&apos;t worry if you don&apos;t see your video right away - it takes a few minutes to process.
      </p>
    </div>
  )
}

export default WebhookNote


