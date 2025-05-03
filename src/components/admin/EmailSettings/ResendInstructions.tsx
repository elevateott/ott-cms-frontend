'use client'

import React from 'react'
import type { CustomComponent } from 'payload'
import type { UIFieldProps } from '@/types/UIFieldProps'

const ResendInstructions: CustomComponent<UIFieldProps> = () => {
  return (
    <div className="p-4 border rounded bg-gray-50">
      <h4 className="font-medium mb-2">Resend Setup Instructions</h4>
      <ol className="list-decimal pl-5 space-y-2 text-sm">
        <li>Create an account at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">resend.com</a></li>
        <li>Generate an API key in the Resend dashboard</li>
        <li>Verify your domain for better deliverability</li>
        <li>Enter the API key and verified email address here</li>
      </ol>
    </div>
  )
}

export default ResendInstructions
