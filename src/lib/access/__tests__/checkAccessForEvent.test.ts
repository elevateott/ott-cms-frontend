/**
 * Tests for the checkAccessForEvent utility
 */
import { checkAccessForEvent } from '../checkAccessForEvent'

// Mock the getPayload function
jest.mock('payload', () => ({
  getPayload: jest.fn(),
}))

// Mock the logger
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

describe('checkAccessForEvent', () => {
  // Mock payload instance
  const mockPayload = {
    find: jest.fn(),
    findByID: jest.fn(),
  }

  // Mock getPayload to return our mock payload
  const { getPayload } = require('payload')
  getPayload.mockResolvedValue(mockPayload)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return false if userEmail or eventId is missing', async () => {
    const result1 = await checkAccessForEvent({ userEmail: '', eventId: '123' })
    const result2 = await checkAccessForEvent({ userEmail: 'user@example.com', eventId: '' })

    expect(result1).toBe(false)
    expect(result2).toBe(false)
    expect(getPayload).not.toHaveBeenCalled()
  })

  it('should return false if subscriber is not found', async () => {
    // Mock subscriber not found
    mockPayload.find.mockResolvedValue({ docs: [] })

    const result = await checkAccessForEvent({
      userEmail: 'user@example.com',
      eventId: '123',
    })

    expect(result).toBe(false)
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'subscribers',
      where: { email: { equals: 'user@example.com' } },
    })
  })

  it('should return true if event is free', async () => {
    // Mock subscriber found
    mockPayload.find.mockResolvedValue({
      docs: [{ id: 'sub123', email: 'user@example.com' }],
    })

    // Mock event is free
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      accessType: 'free',
    })

    const result = await checkAccessForEvent({
      userEmail: 'user@example.com',
      eventId: '123',
    })

    expect(result).toBe(true)
  })

  it('should return true if user has active subscription and event requires subscription', async () => {
    // Mock subscriber with active subscription
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 'sub123',
          email: 'user@example.com',
          subscriptionStatus: 'active',
        },
      ],
    })

    // Mock event requires subscription
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      accessType: 'subscription',
    })

    const result = await checkAccessForEvent({
      userEmail: 'user@example.com',
      eventId: '123',
    })

    expect(result).toBe(true)
  })

  it('should return true if user has active subscription and event does not require PPV', async () => {
    // Mock subscriber with active subscription
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 'sub123',
          email: 'user@example.com',
          subscriptionStatus: 'active',
        },
      ],
    })

    // Mock event with PPV disabled
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      accessType: 'paid_ticket',
      ppvEnabled: false,
    })

    const result = await checkAccessForEvent({
      userEmail: 'user@example.com',
      eventId: '123',
    })

    expect(result).toBe(true)
  })

  it('should return true if user has purchased PPV for the event', async () => {
    // Mock subscriber with PPV purchase
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 'sub123',
          email: 'user@example.com',
          subscriptionStatus: 'canceled',
          purchasedPPV: ['123', '456'],
        },
      ],
    })

    // Mock event with PPV enabled
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      accessType: 'paid_ticket',
      ppvEnabled: true,
    })

    const result = await checkAccessForEvent({
      userEmail: 'user@example.com',
      eventId: '123',
    })

    expect(result).toBe(true)
  })

  it('should return true if user has valid rental for the event', async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 day in the future

    // Mock subscriber with rental
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 'sub123',
          email: 'user@example.com',
          subscriptionStatus: 'canceled',
          purchasedEventRentals: ['123'],
          eventRentalExpirations: [{ eventId: '123', expiresAt: future.toISOString() }],
        },
      ],
    })

    // Mock event with rental enabled
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      accessType: 'paid_ticket',
      rentalEnabled: true,
    })

    const result = await checkAccessForEvent({
      userEmail: 'user@example.com',
      eventId: '123',
    })

    expect(result).toBe(true)
  })

  it('should return false if user has expired rental for the event', async () => {
    const now = new Date()
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day in the past

    // Mock subscriber with expired rental
    mockPayload.find.mockResolvedValue({
      docs: [
        {
          id: 'sub123',
          email: 'user@example.com',
          subscriptionStatus: 'canceled',
          purchasedEventRentals: ['123'],
          eventRentalExpirations: [{ eventId: '123', expiresAt: past.toISOString() }],
        },
      ],
    })

    // Mock event with rental enabled
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      accessType: 'paid_ticket',
      rentalEnabled: true,
    })

    const result = await checkAccessForEvent({
      userEmail: 'user@example.com',
      eventId: '123',
    })

    expect(result).toBe(false)
  })

  it('should return false if an error occurs', async () => {
    // Mock an error
    mockPayload.find.mockRejectedValue(new Error('Test error'))

    const result = await checkAccessForEvent({
      userEmail: 'user@example.com',
      eventId: '123',
    })

    expect(result).toBe(false)
    expect(require('@/utils/logger').logger.error).toHaveBeenCalled()
  })
})
