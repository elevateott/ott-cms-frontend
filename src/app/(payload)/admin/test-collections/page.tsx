'use client'

import { clientLogger } from '@/utils/clientLogger';


import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestCollectionsPage() {
  const [collections, setCollections] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCollections = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/payload')
      const data = await response.json()
      
      if (data.success) {
        setCollections(data.collections)
      } else {
        setError(data.error || 'Failed to fetch collections')
      }
    } catch (err) {
      setError('An error occurred while fetching collections')
      clientLogger.error(err, 'test-collections/page')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Collections</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Registered Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading collections...</p>
          ) : error ? (
            <div className="text-red-500">
              <p>{error}</p>
              <Button 
                onClick={fetchCollections}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-2">Found {collections.length} collections:</p>
              <ul className="list-disc pl-6">
                {collections.map((collection) => (
                  <li key={collection} className="mb-1">
                    {collection}
                  </li>
                ))}
              </ul>
              
              <div className="mt-4">
                <p className="font-semibold">
                  {collections.includes('video-assets') 
                    ? '✅ video-assets collection is registered' 
                    : '❌ video-assets collection is NOT registered'}
                </p>
              </div>
              
              <Button 
                onClick={fetchCollections}
                className="mt-4"
              >
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
