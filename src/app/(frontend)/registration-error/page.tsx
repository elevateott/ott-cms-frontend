'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function RegistrationErrorPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  
  const getErrorMessage = () => {
    switch (reason) {
      case 'missing-token':
        return 'The confirmation link is missing a required token.'
      case 'invalid-token':
        return 'The confirmation link is invalid or has expired.'
      case 'server-error':
        return 'There was a server error while processing your confirmation.'
      default:
        return 'There was an error confirming your registration.'
    }
  }
  
  return (
    <div className="container mx-auto py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center">Registration Error</CardTitle>
            <CardDescription className="text-center">
              We couldn't confirm your registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">
              {getErrorMessage()}
            </p>
            <p className="text-center text-sm text-gray-500">
              Please try registering again or contact support if the problem persists.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/" passHref>
              <Button>Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
