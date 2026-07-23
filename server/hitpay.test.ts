import { describe, it, expect } from 'vitest';

describe('HitPay Sandbox API Credentials Validation', () => {
  it('should have valid HitPay sandbox environment variables configured', () => {
    expect(process.env.HITPAY_API_KEY).toBeDefined();
    expect(process.env.HITPAY_API_KEY).toMatch(/^test_/); // Sandbox key starts with test_
    expect(process.env.HITPAY_API_SECRET).toBeDefined();
    expect(process.env.HITPAY_API_URL).toBe('https://api.sandbox.hit-pay.com');
  });

  it('should successfully create a payment request with HitPay sandbox API', async () => {
    const apiKey = process.env.HITPAY_API_KEY!;
    const apiUrl = process.env.HITPAY_API_URL!;

    // Create a minimal payment request to validate sandbox credentials
    const paymentData = {
      amount: '10.00',
      currency: 'SGD',
      purpose: 'Test Payment - Sandbox Credential Validation',
      reference_number: `TEST-${Date.now()}`,
      webhook: 'https://example.com/webhook',
      redirect_url: 'https://example.com/success',
    };

    const response = await fetch(`${apiUrl}/v1/payment-requests`, {
      method: 'POST',
      headers: {
        'X-BUSINESS-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    // Check if the API call was successful (201 for creation or 200 for success)
    expect([200, 201]).toContain(response.status);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('url');
    expect(data.status).toBe('pending');
    expect(data.amount).toBe('10.00');
  });
});
