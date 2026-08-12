import type { Request, Response, NextFunction } from "express";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

// Single-instance in-memory store: fine for this app's current traffic and
// single-Railway-instance deployment. Resets on restart and doesn't share
// state across multiple instances — revisit with a shared store (e.g. Redis)
// if this ever runs behind horizontal scaling.
const hits = new Map<string, { count: number; resetAt: number }>();

// Periodically drop expired entries so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  hits.forEach((entry, key) => {
    if (entry.resetAt <= now) hits.delete(key);
  });
}, 60_000).unref();

// Test-only escape hatch: the counter store is a module-level singleton, so
// without this, tests that call a rate-limited procedure repeatedly would
// accumulate state across the whole suite (or across repeated runs in the
// same process) and start failing once they cross the limit by coincidence.
export function resetRateLimits(): void {
  hits.clear();
}

export function checkRateLimit(key: string, { windowMs, max }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

// Express's req.ip respects `app.set('trust proxy', ...)`, so this reflects
// the real client IP once that's configured (see server/_core/index.ts).
export function clientIp(req: { ip?: string; socket?: { remoteAddress?: string } }): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Plain Express middleware: rate-limits a route per client IP.
 * Usage: app.post('/api/webhooks/hitpay', rateLimitExpress({...}), handler)
 */
export function rateLimitExpress(options: RateLimitOptions) {
  return function middleware(req: Request, res: Response, next: NextFunction) {
    const key = clientIp(req);
    const result = checkRateLimit(key, options);

    if (!result.allowed) {
      res.setHeader("Retry-After", Math.ceil(result.retryAfterMs / 1000).toString());
      return res.status(429).json({ error: "Too many requests" });
    }

    next();
  };
}
