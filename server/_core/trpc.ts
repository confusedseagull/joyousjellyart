import { UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { checkRateLimit, clientIp, type RateLimitOptions } from "./rateLimit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Rate-limits a procedure per client IP. Apply to any public procedure that's
 * either sensitive to brute-forcing (login) or expensive/abusable (order
 * creation, paid third-party API calls like delivery fee lookups).
 */
export function rateLimited(options: RateLimitOptions) {
  return t.middleware(async ({ ctx, next }) => {
    const result = checkRateLimit(clientIp(ctx.req), options);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many requests. Please try again in ${Math.ceil(result.retryAfterMs / 1000)}s.`,
      });
    }

    return next();
  });
}

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.admin) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        admin: ctx.admin,
      },
    });
  }),
);
