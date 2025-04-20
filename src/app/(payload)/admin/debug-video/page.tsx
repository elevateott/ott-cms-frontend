'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function DebugVideoPage() {
  const [title, setTitle] = useState('Debug Test Video')
  const [description, setDescription] = useState('This is a test video for debugging')
  const [sourceType, setSourceType] = useState('embedded')
  const [embeddedUrl, setEmbeddedUrl] = useState('https://example.com/video.m3u8')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Create a video using our debug endpoint
      const response = await fetch('/api/debug-video-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          sourceType,
          embeddedUrl: sourceType === 'embedded' ? embeddedUrl : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to create video')
        setResult(data)
      }
    } catch (err) {
      console.error('Error creating video:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Also try the direct Payload API
  const handleDirectPayloadCreate = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      // Create a video using the direct Payload API
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          sourceType,
          embeddedUrl: sourceType === 'embedded' ? embeddedUrl : undefined,
        }),
      })

      const data = await response.json()
      console.log('Direct Payload API response:', data)

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.errors ? JSON.stringify(data.errors) : data.message || 'Failed to create video')
        setResult(data)
      }
    } catch (err) {
      console.error('Error creating video:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Video Creation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Test Video</CardTitle>
            <CardDescription>
              Use this form to test video creation and debug any issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sourceType">Source Type</Label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="embedded">Embedded</SelectItem>
                    <SelectItem value="mux">Mux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {sourceType === 'embedded' && (
                <div className="space-y-2">
                  <Label htmlFor="embeddedUrl">Embedded URL</Label>
                  <Input
                    id="embeddedUrl"
                    value={embeddedUrl}
                    onChange={(e) => setEmbeddedUrl(e.target.value)}
                  />
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create with Debug API'}
            </Button>
            <Button onClick={handleDirectPayloadCreate} disabled={loading} variant="outline">
              {loading ? 'Creating...' : 'Create with Direct API'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              Response from the API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && result.success && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Video created successfully!</AlertDescription>
              </Alert>
            )}
            
            {result && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Response Data:</h3>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
