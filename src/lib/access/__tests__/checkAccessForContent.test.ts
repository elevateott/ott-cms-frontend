/**
 * Tests for the checkAccessForContent utility
 */
import { checkAccessForContent } from '../checkAccessForContent';

// Mock the getPayloadHMR function
jest.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: jest.fn(),
}));

// Mock the logger
jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe('checkAccessForContent', () => {
  // Mock payload instance
  const mockPayload = {
    find: jest.fn(),
    findByID: jest.fn(),
  };
  
  // Mock getPayloadHMR to return our mock payload
  const { getPayloadHMR } = require('@payloadcms/next/utilities');
  getPayloadHMR.mockResolvedValue(mockPayload);
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return false if userEmail or contentId is missing', async () => {
    const result1 = await checkAccessForContent({ userEmail: '', contentId: '123' });
    const result2 = await checkAccessForContent({ userEmail: 'user@example.com', contentId: '' });
    
    expect(result1).toBe(false);
    expect(result2).toBe(false);
    expect(getPayloadHMR).not.toHaveBeenCalled();
  });
  
  it('should return false if subscriber is not found', async () => {
    // Mock subscriber not found
    mockPayload.find.mockResolvedValue({ docs: [] });
    
    const result = await checkAccessForContent({
      userEmail: 'user@example.com',
      contentId: '123',
    });
    
    expect(result).toBe(false);
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'subscribers',
      where: { email: { equals: 'user@example.com' } },
    });
  });
  
  it('should return true if content is free', async () => {
    // Mock subscriber found
    mockPayload.find.mockResolvedValue({
      docs: [{ id: 'sub123', email: 'user@example.com' }],
    });
    
    // Mock content is free
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      isFree: true,
    });
    
    const result = await checkAccessForContent({
      userEmail: 'user@example.com',
      contentId: '123',
    });
    
    expect(result).toBe(true);
  });
  
  it('should return true if user has active subscription', async () => {
    // Mock subscriber with active subscription
    mockPayload.find.mockResolvedValue({
      docs: [{ 
        id: 'sub123', 
        email: 'user@example.com',
        subscriptionStatus: 'active',
      }],
    });
    
    // Mock content is not free
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      isFree: false,
    });
    
    const result = await checkAccessForContent({
      userEmail: 'user@example.com',
      contentId: '123',
    });
    
    expect(result).toBe(true);
  });
  
  it('should return true if user has valid rental for the content', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day in the future
    
    // Mock subscriber with rental
    mockPayload.find.mockResolvedValue({
      docs: [{ 
        id: 'sub123', 
        email: 'user@example.com',
        subscriptionStatus: 'canceled',
        purchasedRentals: ['123'],
        rentalExpirations: [
          { contentId: '123', expiresAt: future.toISOString() },
        ],
      }],
    });
    
    // Mock content is not free
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      isFree: false,
    });
    
    const result = await checkAccessForContent({
      userEmail: 'user@example.com',
      contentId: '123',
    });
    
    expect(result).toBe(true);
  });
  
  it('should return false if user has expired rental for the content', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day in the past
    
    // Mock subscriber with expired rental
    mockPayload.find.mockResolvedValue({
      docs: [{ 
        id: 'sub123', 
        email: 'user@example.com',
        subscriptionStatus: 'canceled',
        purchasedRentals: ['123'],
        rentalExpirations: [
          { contentId: '123', expiresAt: past.toISOString() },
        ],
      }],
    });
    
    // Mock content is not free
    mockPayload.findByID.mockResolvedValue({
      id: '123',
      isFree: false,
    });
    
    const result = await checkAccessForContent({
      userEmail: 'user@example.com',
      contentId: '123',
    });
    
    expect(result).toBe(false);
  });
  
  it('should return false if an error occurs', async () => {
    // Mock an error
    mockPayload.find.mockRejectedValue(new Error('Test error'));
    
    const result = await checkAccessForContent({
      userEmail: 'user@example.com',
      contentId: '123',
    });
    
    expect(result).toBe(false);
    expect(require('@/utils/logger').logger.error).toHaveBeenCalled();
  });
});
