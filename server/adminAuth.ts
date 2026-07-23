import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminUsers } from "../drizzle/schema";
import { createAdminSessionToken } from "./_core/adminSession";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

export const adminAuthRouter = router({
  // Sign up a new admin. Requires an existing admin session so the
  // dashboard can't be self-served into by anyone who finds the URL.
  signup: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Admin with this email already exists",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      await db.insert(adminUsers).values({
        email: input.email,
        passwordHash,
        name: input.name,
      });

      return {
        success: true,
        message: "Admin account created successfully",
      };
    }),

  // Login
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, input.email))
        .limit(1);

      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const validPassword = await bcrypt.compare(input.password, admin.passwordHash);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      await db
        .update(adminUsers)
        .set({ lastSignedIn: new Date() })
        .where(eq(adminUsers.id, admin.id));

      const sessionToken = await createAdminSessionToken(admin.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      };
    }),

  // Get current admin session
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.admin) return null;
    return {
      id: ctx.admin.id,
      email: ctx.admin.email,
      name: ctx.admin.name,
    };
  }),

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
});
