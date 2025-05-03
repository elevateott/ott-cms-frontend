'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'

export const PurchasedProductsCountCell: React.FC<{ cellProps: any }> = ({ cellProps }) => {
  const { row } = cellProps
  const { purchasedProducts } = row.original

  const count = purchasedProducts?.length || 0

  return (
    <Badge variant={count > 0 ? 'default' : 'outline'} className="whitespace-nowrap">
      {count} Product{count !== 1 ? 's' : ''}
    </Badge>
  )
}

export default PurchasedProductsCountCell
