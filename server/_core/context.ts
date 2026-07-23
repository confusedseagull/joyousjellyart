import { COOKIE_NAME } from "@shared/const";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import { eq } from "drizzle-orm";
import type { AdminUser } from "../../drizzle/schema";
import { adminUsers } from "../../drizzle/schema";
import { getDb } from "../db";
import { verifyAdminSessionToken } from "./adminSession";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  admin: AdminUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let admin: AdminUser | null = null;

  try {
    const cookies = parseCookieHeader(opts.req.headers.cookie ?? "");
    const adminId = await verifyAdminSessionToken(cookies[COOKIE_NAME]);

    if (adminId !== null) {
      const db = await getDb();
      if (db) {
        const [row] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, adminId))
          .limit(1);
        admin = row ?? null;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    admin = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    admin,
  };
}
