import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../(frontend)/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Event System Documentation',
  description: 'Documentation for the OTT CMS event system',
}

export default function EventSystemDocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="container mx-auto">
          <div className="py-8">
            <a href="/" className="text-blue-600 hover:underline mb-4 inline-block">
              &larr; Back to Home
            </a>
          </div>
          {children}
        </div>
      </body>
    </html>
  )
}
