'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'

interface ManageBillingButtonProps {
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  returnUrl?: string
}

export const ManageBillingButton = ({
  className,
  variant = 'default',
  size = 'default',
  returnUrl,
}: ManageBillingButtonProps) => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleClick = async () => {
    try {
      setLoading(true)

      // Call the API to create a Stripe Customer Portal session
      const response = await fetch('/api/payments/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe Customer Portal session')
      }

      // Redirect to the Stripe Customer Portal
      window.location.href = data.url
    } catch (error) {
      clientLogger.error(error, 'ManageBillingButton.handleClick')
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open billing portal',
        variant: 'destructive',
      })
      
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
    >
      {loading ? 'Loading...' : 'Manage Billing'}
    </Button>
  )
}
