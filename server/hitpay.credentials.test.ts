import { describe, it, expect } from 'vitest';

describe('HitPay Production Credentials', () => {
  it('should have production API key configured', () => {
    expect(process.env.HITPAY_API_KEY).toBeDefined();
    expect(process.env.HITPAY_API_KEY).toMatch(/^live_/);
    expect(process.env.HITPAY_API_KEY!.length).toBeGreaterThan(20);
  });

  it('should have production API secret configured', () => {
    expect(process.env.HITPAY_API_SECRET).toBeDefined();
    expect(process.env.HITPAY_API_SECRET!.length).toBeGreaterThan(20);
  });

  it('should have production API URL configured', () => {
    expect(process.env.HITPAY_API_URL).toBeDefined();
    expect(process.env.HITPAY_API_URL).toBe('https://api.hit-pay.com');
  });

  it('should not be using sandbox/test credentials', () => {
    expect(process.env.HITPAY_API_KEY).not.toMatch(/^test_/);
    expect(process.env.HITPAY_API_KEY).not.toMatch(/^sandbox_/);
    expect(process.env.HITPAY_API_URL).not.toContain('sandbox');
  });
});
