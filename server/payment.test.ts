import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from './routers';
import * as hitpayModule from './hitpay';

// Mock the HitPay module
vi.mock('./hitpay', () => ({
  createPaymentRequest: vi.fn(),
}));

describe('Payment Request Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create payment request for an order', async () => {
    const mockPaymentRequest = {
      id: 'payment_req_123',
      url: 'https://sandbox.hit-pay.com/payment/payment_req_123',
      status: 'pending',
      amount: '125.00',
      currency: 'SGD',
      reference_number: 'ORD-1',
      created_at: new Date().toISOString(),
    };

    vi.mocked(hitpayModule.createPaymentRequest).mockResolvedValue(mockPaymentRequest);

    const caller = appRouter.createCaller({
      req: {
        headers: {
          host: 'localhost:3000',
        },
        secure: false,
      } as any,
      res: {} as any,
      admin: null,
    });

    const result = await caller.payment.createRequest({
      orderId: 1,
      amount: '125.00',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+6512345678',
    });

    expect(result).toEqual(mockPaymentRequest);
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    expect(hitpayModule.createPaymentRequest).toHaveBeenCalledWith({
      amount: '125.00',
      currency: 'SGD',
      purpose: 'Order JJA0001 - Joyous Jelly Art',
      reference_number: 'ORD-1',
      webhook: `${baseUrl}/api/webhooks/hitpay`,
      redirect_url: `${baseUrl}/order-confirmation?order=JJA0001`,
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '+6512345678',
      payment_methods: ['paynow_online', 'card'],
    });
  });

  it('should create payment request for an order with a different id', async () => {
    const mockPaymentRequest = {
      id: 'payment_req_456',
      url: 'https://sandbox.hit-pay.com/payment/payment_req_456',
      status: 'pending',
      amount: '200.00',
      currency: 'SGD',
      reference_number: 'ORD-2',
      created_at: new Date().toISOString(),
    };

    vi.mocked(hitpayModule.createPaymentRequest).mockResolvedValue(mockPaymentRequest);

    const caller = appRouter.createCaller({
      req: {
        headers: {
          host: 'localhost:3000',
        },
        secure: false,
      } as any,
      res: {} as any,
      admin: null,
    });

    const result = await caller.payment.createRequest({
      orderId: 2,
      amount: '200.00',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '+6587654321',
    });

    expect(result).toEqual(mockPaymentRequest);
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    expect(hitpayModule.createPaymentRequest).toHaveBeenCalledWith({
      amount: '200.00',
      currency: 'SGD',
      purpose: 'Order JJA0002 - Joyous Jelly Art',
      reference_number: 'ORD-2',
      webhook: `${baseUrl}/api/webhooks/hitpay`,
      redirect_url: `${baseUrl}/order-confirmation?order=JJA0002`,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+6587654321',
      payment_methods: ['paynow_online', 'card'],
    });
  });

  it('should use correct base URL from request headers', async () => {
    const mockPaymentRequest = {
      id: 'payment_req_789',
      url: 'https://sandbox.hit-pay.com/payment/payment_req_789',
      status: 'pending',
      amount: '150.00',
      currency: 'SGD',
      reference_number: 'ORD-5',
      created_at: new Date().toISOString(),
    };

    vi.mocked(hitpayModule.createPaymentRequest).mockResolvedValue(mockPaymentRequest);

    const caller = appRouter.createCaller({
      req: {
        headers: {
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'example.com',
        },
        secure: true,
      } as any,
      res: {} as any,
      admin: null,
    });

    await caller.payment.createRequest({
      orderId: 5,
      amount: '150.00',
      customerName: 'Test User',
      customerEmail: 'user@test.com',
      customerPhone: '+6511111111',
    });

    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    expect(hitpayModule.createPaymentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        webhook: `${baseUrl}/api/webhooks/hitpay`,
        redirect_url: `${baseUrl}/order-confirmation?order=JJA0005`,
        payment_methods: ['paynow_online', 'card'],
      })
    );
  });

  it('should format order number with correct padding', async () => {
    const mockPaymentRequest = {
      id: 'payment_req_999',
      url: 'https://sandbox.hit-pay.com/payment/payment_req_999',
      status: 'pending',
      amount: '100.00',
      currency: 'SGD',
      reference_number: 'ORD-9999',
      created_at: new Date().toISOString(),
    };

    vi.mocked(hitpayModule.createPaymentRequest).mockResolvedValue(mockPaymentRequest);

    const caller = appRouter.createCaller({
      req: {
        headers: {
          host: 'localhost:3000',
        },
        secure: false,
      } as any,
      res: {} as any,
      admin: null,
    });

    await caller.payment.createRequest({
      orderId: 9999,
      amount: '100.00',
      customerName: 'Test',
      customerEmail: 'test@test.com',
      customerPhone: '+6500000000',
    });

    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    expect(hitpayModule.createPaymentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'Order JJA9999 - Joyous Jelly Art',
        reference_number: 'ORD-9999',
        redirect_url: `${baseUrl}/order-confirmation?order=JJA9999`,
        payment_methods: ['paynow_online', 'card'],
      })
    );
  });
});
