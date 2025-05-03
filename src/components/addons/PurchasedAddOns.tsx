'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utilities/formatDate'

interface AddOn {
  id: string
  title: string
  description: string
  type: 'one-time' | 'recurring'
}

interface RecurringAddOn {
  addon: AddOn
  status: 'active' | 'trialing' | 'past_due' | 'canceled'
  startedAt: string
  currentPeriodEnd?: string
}

interface PurchasedAddOnsProps {
  oneTimeAddOns: AddOn[]
  recurringAddOns: RecurringAddOn[]
}

export function PurchasedAddOns({ oneTimeAddOns = [], recurringAddOns = [] }: PurchasedAddOnsProps) {
  if (oneTimeAddOns.length === 0 && recurringAddOns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        You haven't purchased any add-ons yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {recurringAddOns.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Recurring Add-Ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recurringAddOns.map((item) => (
              <Card key={item.addon.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{item.addon.title}</CardTitle>
                    <Badge 
                      variant={
                        item.status === 'active' ? 'default' : 
                        item.status === 'trialing' ? 'secondary' : 
                        item.status === 'past_due' ? 'destructive' : 
                        'outline'
                      }
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription>{item.addon.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span>{formatDate(item.startedAt)}</span>
                    </div>
                    {item.currentPeriodEnd && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next billing date:</span>
                        <span>{formatDate(item.currentPeriodEnd)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {oneTimeAddOns.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">One-Time Add-Ons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oneTimeAddOns.map((addon) => (
              <Card key={addon.id}>
                <CardHeader>
                  <CardTitle>{addon.title}</CardTitle>
                  <CardDescription>{addon.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchasedAddOns
