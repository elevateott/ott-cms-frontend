'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { clientLogger } from '@/utils/clientLogger'
import { LockIcon } from 'lucide-react'

interface PlanRequirementMessageProps {
  requiredPlans: string[] | { id: string; name?: string }[]
}

/**
 * Component to display a message about required subscription plans
 */
export const PlanRequirementMessage: React.FC<PlanRequirementMessageProps> = ({ requiredPlans }) => {
  const [planNames, setPlanNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch plan details if we only have IDs
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        setLoading(true)

        // If we already have plan names, use them
        if (requiredPlans.length > 0 && typeof requiredPlans[0] !== 'string' && requiredPlans[0].name) {
          setPlanNames(requiredPlans.map((plan: any) => plan.name))
          return
        }

        // Otherwise, fetch plan details from the API
        const planIds = requiredPlans.map((plan) => (typeof plan === 'string' ? plan : plan.id))
        const planPromises = planIds.map((id) => 
          fetch(`/api/subscription-plans/${id}`).then(res => res.json())
        )
        
        const planDetails = await Promise.all(planPromises)
        setPlanNames(planDetails.map(plan => plan.name))
      } catch (error) {
        clientLogger.error('Error fetching plan details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (requiredPlans && requiredPlans.length > 0) {
      fetchPlanDetails()
    }
  }, [requiredPlans])

  if (loading || planNames.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <LockIcon className="h-5 w-5 text-amber-500" />
          Subscription Plan Required
        </CardTitle>
        <CardDescription>
          This content requires a specific subscription plan to access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          This content is available exclusively to subscribers with the following plan{planNames.length > 1 ? 's' : ''}:
        </p>
        <ul className="list-disc pl-6 mt-2">
          {planNames.map((name, index) => (
            <li key={index} className="font-medium">{name}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={() => window.location.href = '/subscribe'}>View Plans</Button>
      </CardFooter>
    </Card>
  )
}

export default PlanRequirementMessage
