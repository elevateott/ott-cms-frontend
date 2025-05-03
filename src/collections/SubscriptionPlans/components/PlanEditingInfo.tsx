'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon, AlertTriangleIcon } from 'lucide-react'
import { hasPlanSubscribers } from '@/services/subscription/hasPlanSubscribers'
import { useConfig } from 'payload/components/utilities'

const PlanEditingInfo: React.FC = () => {
  const { document, id } = useDocumentInfo()
  const { serverURL } = useConfig()
  const [hasSubscribers, setHasSubscribers] = React.useState<boolean | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const checkSubscribers = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        
        // Check if plan has subscribers via API
        const response = await fetch(`${serverURL}/api/check-plan-subscribers?planId=${id}`, {
          credentials: 'include',
        })
        
        if (response.ok) {
          const data = await response.json()
          setHasSubscribers(data.hasSubscribers)
        } else {
          // Default to true for safety if API fails
          setHasSubscribers(true)
        }
      } catch (error) {
        console.error('Error checking subscribers:', error)
        // Default to true for safety
        setHasSubscribers(true)
      } finally {
        setLoading(false)
      }
    }
    
    checkSubscribers()
  }, [id, serverURL])

  if (loading || hasSubscribers === null) {
    return null
  }

  return (
    <div className="mb-6">
      {hasSubscribers ? (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Plan Has Active Subscribers</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p>
              This plan has active subscribers. The following fields <strong>cannot</strong> be modified:
            </p>
            <ul className="list-disc ml-6 mt-2">
              <li>Price</li>
              <li>Billing Interval</li>
              <li>Trial Period Days</li>
              <li>Setup Fee Amount</li>
              <li>Payment Provider</li>
            </ul>
            <p className="mt-2">
              You can still modify non-critical fields like name, description, and features.
              To change billing details, use the "Clone Plan" button to create a new version.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <InfoIcon className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Plan Has No Subscribers</AlertTitle>
          <AlertDescription className="text-green-700">
            <p>
              This plan has no active subscribers. You can freely modify all fields.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default PlanEditingInfo
