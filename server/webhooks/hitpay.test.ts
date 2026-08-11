import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { handleHitPayWebhook } from './hitpay';
import * as hitpayModule from '../hitpay';
import * as dbModule from '../db';

// Mock the dependencies
vi.mock('../hitpay', () => ({
  verifyWebhookSignature: vi.fn(),
}));

vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

describe('HitPay Webhook Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockDb: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    // Setup mock database
    mockDb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb);
  });

  it('should reject webhook with invalid signature', async () => {
    mockRequest = {
      body: {
        payment_id: 'test_payment_123',
        reference_number: 'ORD-1',
        status: 'completed',
        amount: '100.00',
        currency: 'SGD',
        hmac: 'invalid_signature',
      },
    };

    vi.mocked(hitpayModule.verifyWebhookSignature).mockReturnValue(false);

    await handleHitPayWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
  });

  it('should process completed order payment', async () => {
    mockRequest = {
      body: {
        payment_id: 'test_payment_123',
        reference_number: 'ORD-1',
        status: 'completed',
        amount: '100.00',
        currency: 'SGD',
        hmac: 'valid_signature',
      },
    };

    vi.mocked(hitpayModule.verifyWebhookSignature).mockReturnValue(true);

    await handleHitPayWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith({
      paymentStatus: 'paid',
      paymentId: 'test_payment_123',
    });
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Webhook processed successfully' });
  });

  it('should ignore non-completed payments', async () => {
    mockRequest = {
      body: {
        payment_id: 'test_payment_789',
        reference_number: 'ORD-3',
        status: 'pending',
        amount: '75.00',
        currency: 'SGD',
        hmac: 'valid_signature',
      },
    };

    vi.mocked(hitpayModule.verifyWebhookSignature).mockReturnValue(true);

    await handleHitPayWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockDb.update).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Payment not completed yet' });
  });

  it('should handle invalid reference number format', async () => {
    mockRequest = {
      body: {
        payment_id: 'test_payment_999',
        reference_number: 'INVALID',
        status: 'completed',
        amount: '50.00',
        currency: 'SGD',
        hmac: 'valid_signature',
      },
    };

    vi.mocked(hitpayModule.verifyWebhookSignature).mockReturnValue(true);

    await handleHitPayWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid reference number' });
  });

  it('should reject a reference number with an unrecognized prefix', async () => {
    mockRequest = {
      body: {
        payment_id: 'test_payment_998',
        reference_number: 'CNY-1',
        status: 'completed',
        amount: '50.00',
        currency: 'SGD',
        hmac: 'valid_signature',
      },
    };

    vi.mocked(hitpayModule.verifyWebhookSignature).mockReturnValue(true);

    await handleHitPayWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid reference number' });
  });

  it('should handle database errors gracefully', async () => {
    mockRequest = {
      body: {
        payment_id: 'test_payment_error',
        reference_number: 'ORD-999',
        status: 'completed',
        amount: '200.00',
        currency: 'SGD',
        hmac: 'valid_signature',
      },
    };

    vi.mocked(hitpayModule.verifyWebhookSignature).mockReturnValue(true);
    vi.mocked(dbModule.getDb).mockResolvedValue(null);

    await handleHitPayWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
