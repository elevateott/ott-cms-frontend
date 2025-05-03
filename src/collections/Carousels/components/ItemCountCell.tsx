'use client'

import React from 'react'

// This component is used as a Cell in the Carousels collection
const ItemCountCell = ({ cellData, rowData }: { cellData: any; rowData: any }) => {
  const count = rowData?.items?.length || 0
  return <span>{count} items</span>
}

// Export as both default and named export
export { ItemCountCell }
export default ItemCountCell
