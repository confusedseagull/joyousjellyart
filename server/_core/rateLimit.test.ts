import { describe, it, expect, vi, afterEach } from "vitest";
import { checkRateLimit, rateLimitExpress } from "./rateLimit";

describe("checkRateLimit", () => {
  it("allows requests up to the max within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { windowMs: 60_000, max: 5 }).allowed).toBe(true);
    }
  });

  it("rejects the request once the max is exceeded", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, { windowMs: 60_000, max: 5 });
    }
    const result = checkRateLimit(key, { windowMs: 60_000, max: 5 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(keyA, { windowMs: 60_000, max: 5 });

    expect(checkRateLimit(keyA, { windowMs: 60_000, max: 5 }).allowed).toBe(false);
    expect(checkRateLimit(keyB, { windowMs: 60_000, max: 5 }).allowed).toBe(true);
  });

  it("resets the count once the window elapses", () => {
    vi.useFakeTimers();
    try {
      const key = `test-${Math.random()}`;
      for (let i = 0; i < 5; i++) checkRateLimit(key, { windowMs: 1000, max: 5 });
      expect(checkRateLimit(key, { windowMs: 1000, max: 5 }).allowed).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(checkRateLimit(key, { windowMs: 1000, max: 5 }).allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("rateLimitExpress", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls next() while under the limit", () => {
    const middleware = rateLimitExpress({ windowMs: 60_000, max: 2 });
    const req = { ip: `1.2.3.${Math.floor(Math.random() * 255)}` } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() } as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 429 once the limit is exceeded", () => {
    const middleware = rateLimitExpress({ windowMs: 60_000, max: 1 });
    const req = { ip: `5.6.7.${Math.floor(Math.random() * 255)}` } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), setHeader: vi.fn() } as any;
    const next = vi.fn();

    middleware(req, res, next);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: "Too many requests" });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
