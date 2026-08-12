import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { adminUsers, type AdminUser } from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { resetRateLimits } from "./_core/rateLimit";

// adminAuth.login is rate-limited per IP (max 5/15min); the test context has
// no real IP, so every call in this file shares one bucket. Reset it before
// each test so the suite's pass/fail doesn't depend on execution order/count.
beforeEach(() => {
  resetRateLimits();
});

type CookieCall = { name: string; value: string; options: Record<string, unknown> };

function createMockContext(admin: AdminUser | null = null) {
  const setCookies: CookieCall[] = [];
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];

  const ctx: TrpcContext = {
    admin,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as unknown as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

async function createTestAdmin(email: string, password: string, name?: string): Promise<AdminUser> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(adminUsers).values({ email, passwordHash, name });

  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (!row) throw new Error("Failed to create test admin");
  return row;
}

describe("Admin Authentication", () => {
  let testEmail: string;
  let testPassword: string;
  let existingAdmin: AdminUser;

  beforeAll(async () => {
    testEmail = `test-${Date.now()}@example.com`;
    testPassword = "testpassword123";
    existingAdmin = await createTestAdmin(`seed-${Date.now()}@example.com`, "seedpassword123", "Seed Admin");
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(adminUsers).where(eq(adminUsers.email, testEmail));
      await db.delete(adminUsers).where(eq(adminUsers.id, existingAdmin.id));
    }
  });

  it("requires an existing admin session to create a new admin account", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminAuth.signup({
        email: testEmail,
        password: testPassword,
        name: "Test Admin",
      })
    ).rejects.toThrow();
  });

  it("allows a logged-in admin to create a new admin account", async () => {
    const { ctx } = createMockContext(existingAdmin);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAuth.signup({
      email: testEmail,
      password: testPassword,
      name: "Test Admin",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("created successfully");
  });

  it("should not allow duplicate email signup", async () => {
    const { ctx } = createMockContext(existingAdmin);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminAuth.signup({
        email: testEmail,
        password: testPassword,
      })
    ).rejects.toThrow();
  });

  it("should login with correct credentials and set a session cookie", async () => {
    const { ctx, setCookies } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAuth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("email", testEmail);
    expect(result).toHaveProperty("name", "Test Admin");
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe("app_session_id");
    expect(typeof setCookies[0]?.value).toBe("string");
  });

  it("should reject login with incorrect password", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminAuth.login({
        email: testEmail,
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should reject login with non-existent email", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminAuth.login({
        email: "nonexistent@example.com",
        password: testPassword,
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("adminAuth.me returns null when logged out and the admin when logged in", async () => {
    const loggedOut = appRouter.createCaller(createMockContext(null).ctx);
    expect(await loggedOut.adminAuth.me()).toBeNull();

    const loggedIn = appRouter.createCaller(createMockContext(existingAdmin).ctx);
    const me = await loggedIn.adminAuth.me();
    expect(me).toMatchObject({ id: existingAdmin.id, email: existingAdmin.email });
  });

  it("adminAuth.logout clears the session cookie", async () => {
    const { ctx, clearedCookies } = createMockContext(existingAdmin);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAuth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe("app_session_id");
  });
});
