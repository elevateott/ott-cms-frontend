'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useConfig } from 'payload/components/utilities'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/utils/logger'

const ClonePlanButton: React.FC = () => {
  const { id, collection, getDocPreferences } = useDocumentInfo()
  const { serverURL } = useConfig()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clonePlan = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Fetch the current plan
      const response = await fetch(`${serverURL}/api/${collection}/${id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch plan details')
      }
      
      const plan = await response.json()
      
      // 2. Prepare the new plan data
      // Remove fields that should not be cloned
      const {
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        stripeProductId: _stripeProductId,
        stripePriceId: _stripePriceId,
        stripeSetupFeeId: _stripeSetupFeeId,
        paypalProductId: _paypalProductId,
        paypalPlanId: _paypalPlanId,
        ...newPlanData
      } = plan

      // Increment version number
      newPlanData.version = (plan.version || 1) + 1
      
      // Update name to indicate it's a new version
      newPlanData.name = `${plan.name} (v${newPlanData.version})`
      
      // Ensure the new plan is active
      newPlanData.isActive = true
      
      // 3. Create the new plan
      const createResponse = await fetch(`${serverURL}/api/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPlanData),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        throw new Error(errorData.errors?.[0]?.message || 'Failed to create new plan version')
      }

      const newPlan = await createResponse.json()

      // Show success message
      toast({
        title: 'Plan Cloned Successfully',
        description: `Created new version: ${newPlan.name}`,
        duration: 5000,
      })

      // Redirect to the new plan
      window.location.href = `${window.location.origin}/admin/collections/${collection}/${newPlan.id}`
    } catch (error) {
      logger.error({ error, context: 'ClonePlanButton' }, 'Error cloning plan')
      setError(error.message || 'An error occurred while cloning the plan')
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to clone plan',
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
        >
          Clone Plan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Create New Plan Version?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will create a new version of this plan with all the same settings. The new plan will be active and can be modified independently of the original plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={clonePlan} disabled={loading}>
            {loading ? 'Creating...' : 'Create New Version'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ClonePlanButton
