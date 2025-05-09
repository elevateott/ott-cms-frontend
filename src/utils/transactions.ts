/**
 * Utility functions for recording transactions
 */
import { Payload } from 'payload'
import { logger } from '@/utils/logger'

/**
 * Record a transaction in the database
 * @param payload Payload instance
 * @param transactionData Transaction data
 * @returns The created transaction
 */
export const recordTransaction = async (
  payload: Payload,
  transactionData: {
    email: string
    type: 'subscription' | 'ppv' | 'rental' | 'product' | 'addon'
    amount: number
    currency?: string
    paymentProvider: 'stripe' | 'paypal' | 'manual'
    status?: 'completed' | 'pending' | 'failed' | 'refunded'
    subscriber?: string
    event?: string
    content?: string
    plan?: string
    product?: string
    addon?: string
    addonType?: 'one-time' | 'recurring'
    transactionId?: string
    paymentMethod?: string
    metadata?: any
    rentalDuration?: number
    expiresAt?: string
    notes?: string
  },
) => {
  try {
    const {
      email,
      type,
      amount,
      currency = 'USD',
      paymentProvider,
      status = 'completed',
      subscriber,
      event,
      content,
      plan,
      transactionId,
      paymentMethod,
      metadata,
      rentalDuration,
      expiresAt,
      notes,
    } = transactionData

    // Create the transaction
    const transaction = await payload.create({
      collection: 'transactions',
      data: {
        email,
        type,
        amount,
        currency,
        paymentProvider,
        status,
        subscriber,
        event,
        content,
        plan,
        transactionId,
        paymentMethod,
        metadata,
        rentalDuration,
        expiresAt,
        notes,
        createdAt: new Date().toISOString(),
      },
    })

    logger.info(
      {
        context: 'transactions',
        transactionId: transaction.id,
        type,
        amount,
        email,
      },
      `Recorded ${type} transaction for ${email}`,
    )

    return transaction
  } catch (error) {
    logger.error(
      {
        context: 'transactions',
        error,
        transactionData,
      },
      'Failed to record transaction',
    )

    // Don't throw the error, just log it
    // This way, if transaction recording fails, it doesn't affect the main flow
    return null
  }
}
