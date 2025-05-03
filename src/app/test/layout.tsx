import React from 'react'
import { Metadata } from 'next'
import TestNavigation from './components/TestNavigation'

// Import test styles
import './test.css'

export const metadata: Metadata = {
  title: 'OTT CMS Test Tools',
  description: 'Testing tools for the OTT CMS platform',
}

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="test-page">
        <TestNavigation />
        {children}
      </body>
    </html>
  )
}
