import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { adminUsers } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

export const adminAuthRouter = router({
  // Sign up a new admin
  signup: publicProcedure
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

      // Check if admin already exists
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

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create admin user
      const [admin] = await db.insert(adminUsers).values({
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find admin by email
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

      // Verify password
      const validPassword = await bcrypt.compare(input.password, admin.passwordHash);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Update last signed in
      await db
        .update(adminUsers)
        .set({ lastSignedIn: new Date() })
        .where(eq(adminUsers.id, admin.id));

      // Store admin ID in session (using ctx.req.session if available)
      // For now, return admin info (client will store in localStorage)
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      };
    }),

  // Get current admin session
  me: publicProcedure.query(async () => {
    // This would check session/cookie in a real implementation
    // For now, client will pass admin ID
    return null;
  }),

  // Logout
  logout: publicProcedure.mutation(async () => {
    // Clear session
    return { success: true };
  }),
});
