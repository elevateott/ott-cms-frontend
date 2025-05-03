'use client'

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

/**
 * Custom field component for displaying helpful information about required plans
 */
const RequiredPlansField: React.FC<{ path: string; label: string }> = (props) => {
  // Use the standard field component for the actual relationship field
  const { value, setValue } = useField<string[]>({ path: props.path })
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch subscription plans to display helpful information
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/subscription-plans?limit=100&where[isActive][equals]=true')
        const data = await response.json()

        if (response.ok) {
          setPlans(data.docs || [])
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  // Get the names of the selected plans
  const selectedPlanNames = value
    ? plans
        .filter((plan) => value.includes(plan.id))
        .map((plan) => plan.name)
        .join(', ')
    : ''

  return (
    <div className="mb-4">
      {/* Render the standard field component */}
      {props.children}

      {/* Show helpful information about the selected plans */}
      {!loading && value && value.length > 0 && (
        <Alert className="mt-2">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Subscription Tier Gating</AlertTitle>
          <AlertDescription>
            This content will only be accessible to subscribers with{' '}
            <strong>{selectedPlanNames}</strong> plan(s).
          </AlertDescription>
        </Alert>
      )}

      {!loading && (!value || value.length === 0) && (
        <Alert className="mt-2">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>No Plan Restrictions</AlertTitle>
          <AlertDescription>
            This content will be accessible to all subscribers, regardless of their plan.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default RequiredPlansField
