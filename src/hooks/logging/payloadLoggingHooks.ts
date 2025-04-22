/**
 * Payload CMS Logging Hooks
 * 
 * This module provides hooks for logging Payload CMS operations.
 */

import type { 
  CollectionBeforeChangeHook, 
  CollectionAfterChangeHook,
  CollectionBeforeDeleteHook,
  CollectionAfterDeleteHook,
  GlobalBeforeChangeHook,
  GlobalAfterChangeHook
} from 'payload'

import { logger } from '@/utils/logger'

/**
 * Log before a collection document is changed
 */
export const logBeforeChange = <T = any>(collectionName: string): CollectionBeforeChangeHook<T> => {
  return ({ data, operation, req }) => {
    const userId = req.user?.id || 'system'
    
    logger.info(
      {
        context: `${collectionName}:beforeChange`,
        operation,
        userId,
        documentId: data.id,
      },
      `${operation} operation on ${collectionName}`
    )
    
    return data
  }
}

/**
 * Log after a collection document is changed
 */
export const logAfterChange = <T = any>(collectionName: string): CollectionAfterChangeHook<T> => {
  return ({ doc, operation, req }) => {
    const userId = req.user?.id || 'system'
    
    logger.info(
      {
        context: `${collectionName}:afterChange`,
        operation,
        userId,
        documentId: doc.id,
      },
      `Completed ${operation} operation on ${collectionName}`
    )
    
    return doc
  }
}

/**
 * Log before a collection document is deleted
 */
export const logBeforeDelete = <T = any>(collectionName: string): CollectionBeforeDeleteHook<T> => {
  return ({ id, req }) => {
    const userId = req.user?.id || 'system'
    
    logger.info(
      {
        context: `${collectionName}:beforeDelete`,
        userId,
        documentId: id,
      },
      `Deleting document from ${collectionName}`
    )
  }
}

/**
 * Log after a collection document is deleted
 */
export const logAfterDelete = <T = any>(collectionName: string): CollectionAfterDeleteHook<T> => {
  return ({ id, doc, req }) => {
    const userId = req.user?.id || 'system'
    
    logger.info(
      {
        context: `${collectionName}:afterDelete`,
        userId,
        documentId: id,
      },
      `Deleted document from ${collectionName}`
    )
    
    return doc
  }
}

/**
 * Log before a global is changed
 */
export const logGlobalBeforeChange = <T = any>(globalName: string): GlobalBeforeChangeHook<T> => {
  return ({ data, req }) => {
    const userId = req.user?.id || 'system'
    
    logger.info(
      {
        context: `${globalName}:beforeChange`,
        userId,
      },
      `Updating global ${globalName}`
    )
    
    return data
  }
}

/**
 * Log after a global is changed
 */
export const logGlobalAfterChange = <T = any>(globalName: string): GlobalAfterChangeHook<T> => {
  return ({ doc, req }) => {
    const userId = req.user?.id || 'system'
    
    logger.info(
      {
        context: `${globalName}:afterChange`,
        userId,
      },
      `Updated global ${globalName}`
    )
    
    return doc
  }
}

/**
 * Create a complete set of logging hooks for a collection
 */
export const createCollectionLoggingHooks = <T = any>(collectionName: string) => {
  return {
    beforeChange: [logBeforeChange<T>(collectionName)],
    afterChange: [logAfterChange<T>(collectionName)],
    beforeDelete: [logBeforeDelete<T>(collectionName)],
    afterDelete: [logAfterDelete<T>(collectionName)],
  }
}

/**
 * Create a complete set of logging hooks for a global
 */
export const createGlobalLoggingHooks = <T = any>(globalName: string) => {
  return {
    beforeChange: [logGlobalBeforeChange<T>(globalName)],
    afterChange: [logGlobalAfterChange<T>(globalName)],
  }
}
