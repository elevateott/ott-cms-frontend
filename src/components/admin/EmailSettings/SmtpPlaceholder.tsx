'use client'

import React from 'react'
import type { CustomComponent } from 'payload'
import type { UIFieldProps } from '@/types/UIFieldProps'

const SmtpPlaceholder: CustomComponent<UIFieldProps> = () => {
  return (
    <div className="p-4 border rounded bg-gray-50">
      <p className="text-gray-500">SMTP configuration will be available in a future update.</p>
    </div>
  )
}

export default SmtpPlaceholder
