// src/hooks/carousels/reorderCarouselItems.ts
import { BeforeChangeHook } from 'payload/dist/collections/config/types'
import { logger } from '@/utils/logger'

/**
 * Hook to ensure carousel items have unique order values
 * 
 * This hook:
 * 1. Sorts items by their order value
 * 2. Detects duplicate order values
 * 3. Shifts items to ensure unique order values
 * 4. Maintains the relative ordering of items
 */
export const reorderCarouselItems: BeforeChangeHook = async ({ data, operation, originalDoc }) => {
  try {
    // Skip if there are no items or only one item
    if (!data.items || !Array.isArray(data.items) || data.items.length <= 1) {
      return data
    }

    // Create a copy of the items array to avoid mutating the original
    const items = [...data.items]
    
    // Sort items by order
    items.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER
      const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER
      return orderA - orderB
    })

    // Check for duplicate order values and fix them
    const usedOrders = new Set<number>()
    let nextAvailableOrder = 1

    // First pass: preserve existing orders where possible
    items.forEach(item => {
      if (typeof item.order === 'number') {
        if (!usedOrders.has(item.order)) {
          usedOrders.add(item.order)
          nextAvailableOrder = Math.max(nextAvailableOrder, item.order + 1)
        }
      }
    })

    // Second pass: assign new orders to items with duplicates or missing orders
    items.forEach(item => {
      if (typeof item.order !== 'number' || usedOrders.has(item.order)) {
        // Find the next available order
        while (usedOrders.has(nextAvailableOrder)) {
          nextAvailableOrder++
        }
        
        // Assign the new order
        item.order = nextAvailableOrder
        usedOrders.add(nextAvailableOrder)
        nextAvailableOrder++
      }
    })

    // Sort again by the updated order values
    items.sort((a, b) => a.order - b.order)

    // If this is an update operation, check if we need to handle reordering
    if (operation === 'update' && originalDoc && originalDoc.items) {
      // If an item's order was explicitly changed, we need to handle shifting other items
      const originalItems = originalDoc.items || []
      
      // Find items whose order was explicitly changed
      const changedItems = items.filter(item => {
        // Find the original item with the same ID
        const originalItem = originalItems.find(origItem => 
          origItem.id === item.id
        )
        
        // If the item is new or its order changed, it's a changed item
        return !originalItem || originalItem.order !== item.order
      })
      
      if (changedItems.length > 0) {
        // Reorder all items to ensure consistent ordering
        items.forEach((item, index) => {
          item.order = index + 1
        })
      }
    }

    // Update the data with the reordered items
    return {
      ...data,
      items,
    }
  } catch (error) {
    logger.error({ context: 'reorderCarouselItems' }, 'Error reordering carousel items:', error)
    return data
  }
}
