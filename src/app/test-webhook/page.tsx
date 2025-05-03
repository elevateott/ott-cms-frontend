'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function TestWebhookPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const triggerWebhook = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/mux/test-webhook')
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Test Mux Webhook</CardTitle>
          <CardDescription>
            This page allows you to test the Mux webhook handler by sending a sample webhook payload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Click the button below to send a sample webhook payload to the webhook handler. This will help
              debug issues with the webhook handler.
            </p>
            
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {result && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Response:</h3>
                <Textarea
                  readOnly
                  className="font-mono h-60"
                  value={JSON.stringify(result, null, 2)}
                />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={triggerWebhook} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Webhook'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
