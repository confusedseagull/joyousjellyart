import { describe, it, expect } from 'vitest';

describe('PUBLIC_URL Environment Variable', () => {
  it('should have PUBLIC_URL environment variable configured', () => {
    expect(process.env.PUBLIC_URL).toBeDefined();
    expect(process.env.PUBLIC_URL).toBe('https://joyousjellyart.manus.space');
  });

  it('should use https protocol', () => {
    const url = new URL(process.env.PUBLIC_URL!);
    expect(url.protocol).toBe('https:');
  });

  it('should have correct domain', () => {
    const url = new URL(process.env.PUBLIC_URL!);
    expect(url.hostname).toBe('joyousjellyart.manus.space');
  });
});
