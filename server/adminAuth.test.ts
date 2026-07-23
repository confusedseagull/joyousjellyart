import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { adminUsers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Admin Authentication", () => {
  let testEmail: string;
  let testPassword: string;

  beforeAll(() => {
    testEmail = `test-${Date.now()}@example.com`;
    testPassword = "testpassword123";
  });

  afterAll(async () => {
    // Cleanup: delete test admin user
    const db = await getDb();
    if (db) {
      await db.delete(adminUsers).where(eq(adminUsers.email, testEmail));
    }
  });

  it("should create a new admin account", async () => {
    const caller = appRouter.createCaller({} as any);
    
    const result = await caller.adminAuth.signup({
      email: testEmail,
      password: testPassword,
      name: "Test Admin",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("created successfully");
  });

  it("should not allow duplicate email signup", async () => {
    const caller = appRouter.createCaller({} as any);
    
    await expect(
      caller.adminAuth.signup({
        email: testEmail,
        password: testPassword,
      })
    ).rejects.toThrow();
  });

  it("should login with correct credentials", async () => {
    const caller = appRouter.createCaller({} as any);
    
    const result = await caller.adminAuth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("email", testEmail);
    expect(result).toHaveProperty("name", "Test Admin");
  });

  it("should reject login with incorrect password", async () => {
    const caller = appRouter.createCaller({} as any);
    
    await expect(
      caller.adminAuth.login({
        email: testEmail,
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("should reject login with non-existent email", async () => {
    const caller = appRouter.createCaller({} as any);
    
    await expect(
      caller.adminAuth.login({
        email: "nonexistent@example.com",
        password: testPassword,
      })
    ).rejects.toThrow("Invalid email or password");
  });
});
