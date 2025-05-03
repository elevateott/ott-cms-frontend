'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

const PlanTrialInfo: React.FC = () => {
  const { document } = useDocumentInfo()

  if (!document) {
    return null
  }

  const { trialPeriodDays, setupFeeAmount } = document

  // If no trial or setup fee, don't show anything
  if (!trialPeriodDays && !setupFeeAmount) {
    return null
  }

  // Format setup fee from cents to dollars
  const formattedSetupFee = setupFeeAmount ? `$${(setupFeeAmount / 100).toFixed(2)}` : 'N/A'

  return (
    <div className="mb-6">
      {trialPeriodDays > 0 && setupFeeAmount > 0 ? (
        <Alert className="bg-amber-50 border-amber-200">
          <InfoIcon className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Paid Trial Configuration</AlertTitle>
          <AlertDescription className="text-amber-700">
            <p>
              This plan has a <strong>{trialPeriodDays}-day trial period</strong> with a{' '}
              <strong>{formattedSetupFee} setup fee</strong> charged immediately.
            </p>
            <p className="mt-2 text-sm">
              ⚠️ The setup fee will be charged immediately, and recurring billing will start after the
              trial period ends.
            </p>
          </AlertDescription>
        </Alert>
      ) : trialPeriodDays > 0 ? (
        <Alert className="bg-green-50 border-green-200">
          <InfoIcon className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Free Trial Configuration</AlertTitle>
          <AlertDescription className="text-green-700">
            <p>
              This plan has a <strong>{trialPeriodDays}-day free trial</strong>. Subscribers will not
              be charged until the trial period ends.
            </p>
          </AlertDescription>
        </Alert>
      ) : setupFeeAmount > 0 ? (
        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Setup Fee Configuration</AlertTitle>
          <AlertDescription className="text-blue-700">
            <p>
              This plan has a <strong>{formattedSetupFee} setup fee</strong> charged at signup.
              Regular subscription billing will also begin immediately.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

export default PlanTrialInfo
