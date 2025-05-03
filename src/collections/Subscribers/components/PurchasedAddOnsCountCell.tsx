// src/collections/Subscribers/components/PurchasedAddOnsCountCell.tsx
import React from 'react'
import { Badge } from '@/components/ui/badge'

export const PurchasedAddOnsCountCell: React.FC<{ rowData: any }> = ({ rowData }) => {
  // Count one-time add-ons
  const oneTimeCount = rowData.purchasedAddOns?.length || 0
  
  // Count recurring add-ons
  const recurringCount = rowData.activeRecurringAddOns?.length || 0
  
  // Total count
  const totalCount = oneTimeCount + recurringCount
  
  if (totalCount === 0) {
    return <span>0</span>
  }
  
  return (
    <div className="flex gap-1">
      <Badge variant="outline">{totalCount}</Badge>
      {oneTimeCount > 0 && recurringCount > 0 && (
        <span className="text-xs text-muted-foreground">
          ({oneTimeCount} one-time, {recurringCount} recurring)
        </span>
      )}
    </div>
  )
}

export default PurchasedAddOnsCountCell
