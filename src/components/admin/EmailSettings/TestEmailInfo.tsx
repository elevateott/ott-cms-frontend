'use client'

import React from 'react'
import type { CustomComponent } from 'payload'
import type { UIFieldProps } from '@/types/UIFieldProps'

const TestEmailInfo: CustomComponent<UIFieldProps> = () => {
  return (
    <div className="p-4 border rounded bg-gray-50">
      <h4 className="font-medium mb-2">Test Email Configuration</h4>
      <p className="mb-2 text-sm">
        You can test your email configuration by visiting the test page:
      </p>
      <a 
        href="/admin/test/send-email" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Open Test Email Page
      </a>
    </div>
  )
}

export default TestEmailInfo
