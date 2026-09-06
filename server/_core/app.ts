import express, { type Express } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleHitPayWebhook } from "../webhooks/hitpay";
import { rateLimitExpress } from "./rateLimit";

// The API surface (webhook + tRPC) as a standalone Express app, decoupled
// from how it's actually run. The traditional entry point (index.ts) wraps
// this in an http.Server + app.listen() for a persistent host (Railway,
// etc.); the Vercel entry point (api/index.ts) exports it directly, since a
// Vercel serverless function just needs a (req, res) => void handler and an
// Express app already is one.
export function createApp(): Express {
  const app = express();

  // Trust exactly one reverse-proxy hop (the platform's edge, in production)
  // so req.ip reflects the real client IP for rate limiting instead of the
  // proxy's own address.
  app.set("trust proxy", 1);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // HitPay webhook endpoint — signature-verified inside the handler, this
  // limit is just a backstop against a flood of junk requests.
  app.post(
    "/api/webhooks/hitpay",
    rateLimitExpress({ windowMs: 60_000, max: 60 }),
    handleHitPayWebhook
  );

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
