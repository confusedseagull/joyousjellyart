import { describe, it, expect } from 'vitest';

describe('PUBLIC_URL Environment Variable', () => {
  it('should have PUBLIC_URL environment variable configured', () => {
    expect(process.env.PUBLIC_URL).toBeDefined();
  });

  it('should be a well-formed URL', () => {
    expect(() => new URL(process.env.PUBLIC_URL!)).not.toThrow();
  });

  it('should use http or https protocol', () => {
    const url = new URL(process.env.PUBLIC_URL!);
    expect(['http:', 'https:']).toContain(url.protocol);
  });
});
