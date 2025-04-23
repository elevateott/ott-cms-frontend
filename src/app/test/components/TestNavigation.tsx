'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const testPages = [{ name: 'Video Asset Creator', path: '/test/videoasset' }]

export default function TestNavigation() {
  const pathname = usePathname()

  return (
    <div className="test-nav">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="font-bold text-lg">OTT CMS Test Tools</div>
          <nav>
            <ul className="flex gap-4">
              {testPages.map((page) => (
                <li key={page.path}>
                  <Link href={page.path} className={pathname === page.path ? 'active' : ''}>
                    {page.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin">Admin Dashboard</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}
