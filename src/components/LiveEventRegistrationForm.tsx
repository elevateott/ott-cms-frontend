'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'

const logger = clientLogger.createContextLogger('LiveEventRegistrationForm')

type RegistrationFormProps = {
  liveEventId: string
  liveEventTitle: string
  className?: string
}

type FormData = {
  firstName: string
  lastName: string
  email: string
}

export const LiveEventRegistrationForm: React.FC<RegistrationFormProps> = ({
  liveEventId,
  liveEventTitle,
  className = '',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const response = await fetch('/api/register-for-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          liveEvent: liveEventId,
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to register for event')
      }
      
      setSubmitSuccess(true)
      reset() // Clear the form
    } catch (error) {
      logger.error('Registration form submission error', error)
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle>Register for {liveEventTitle}</CardTitle>
        <CardDescription>
          Sign up to receive updates and a reminder when this event goes live.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {submitSuccess ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Registration Successful!</AlertTitle>
            <AlertDescription>
              Please check your email to confirm your registration. We'll send you a reminder when the event is about to start.
            </AlertDescription>
          </Alert>
        ) : submitError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Registration Failed</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  {...register('firstName', { required: 'First name is required' })}
                  placeholder="John"
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm">{errors.firstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  {...register('lastName', { required: 'Last name is required' })}
                  placeholder="Doe"
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="john.doe@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Now'
              )}
            </Button>
          </form>
        )}
      </CardContent>
      
      {submitSuccess && (
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSubmitSuccess(false)}
          >
            Register Another Person
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

export default LiveEventRegistrationForm
