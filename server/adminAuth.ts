import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminUsers } from "../drizzle/schema";
import { createAdminSessionToken } from "./_core/adminSession";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, rateLimited, router } from "./_core/trpc";
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

  // Login — rate-limited to blunt brute-force password guessing.
  login: publicProcedure
    .use(rateLimited({ windowMs: 15 * 60_000, max: 5 }))
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

  updateProfile: adminProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (input.email) {
        const existing = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, input.email))
          .limit(1);
        if (existing.length > 0 && existing[0].id !== ctx.admin.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Another admin already uses this email" });
        }
      }

      await db.update(adminUsers).set(input).where(eq(adminUsers.id, ctx.admin.id));

      const [updated] = await db.select().from(adminUsers).where(eq(adminUsers.id, ctx.admin.id)).limit(1);
      return { id: updated.id, email: updated.email, name: updated.name };
    }),

  changePassword: adminProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, ctx.admin.id)).limit(1);
      if (!admin) throw new TRPCError({ code: "NOT_FOUND", message: "Admin not found" });

      const validPassword = await bcrypt.compare(input.currentPassword, admin.passwordHash);
      if (!validPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, ctx.admin.id));

      return { success: true };
    }),
});
