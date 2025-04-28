'use client'

import React from 'react'

// This component is used as a RowLabel in the Carousels collection
const ItemRowLabel = ({ data }: { data: any }) => {
  const itemType = data?.itemType || 'Unknown'
  const itemTitle = data?.item?.title || 'Untitled'
  const order = data?.order || '?'
  return `${order}. ${itemType}: ${itemTitle}`
}

// Export as both default and named export
export { ItemRowLabel }
export default ItemRowLabel
