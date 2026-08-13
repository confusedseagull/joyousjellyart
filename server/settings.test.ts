import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { resetRateLimits } from "./_core/rateLimit";

beforeEach(() => {
  resetRateLimits();
});

type Admin = NonNullable<TrpcContext["admin"]>;

function createAdminContext(): TrpcContext {
  const admin: Admin = {
    id: 1,
    email: "admin@joyousjelly.com",
    passwordHash: "unused-in-tests",
    name: "Admin User",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    admin,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    admin: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("settings.get", () => {
  it("is publicly accessible and returns seeded defaults", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const settings = await caller.settings.get();

    expect(settings).toBeDefined();
    expect(settings.pickupAddress).toBeTruthy();
    expect(settings.shopAddressForDistance).toBeTruthy();
    expect(Array.isArray(settings.deliveryTiers)).toBe(true);
    expect(settings.deliveryTiers.length).toBeGreaterThan(0);
    expect(typeof settings.beyondTierFee).toBe("number");
  });

  it("returns the same single row on repeated calls (lazy-seeded once)", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const first = await caller.settings.get();
    const second = await caller.settings.get();

    expect(second.id).toBe(first.id);
  });
});

describe("settings.update", () => {
  it("requires admin authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.settings.update({ pickupInstructions: "Should not apply" })
    ).rejects.toThrow("Please login");
  });

  it("allows an admin to update and persists the change", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const publicCaller = appRouter.createCaller(createPublicContext());

    const before = await publicCaller.settings.get();

    const updated = await adminCaller.settings.update({
      pickupInstructions: "Test instructions — ready in 1 day",
      beyondTierFee: 99,
    });

    expect(updated.pickupInstructions).toBe("Test instructions — ready in 1 day");
    expect(updated.beyondTierFee).toBe(99);

    const after = await publicCaller.settings.get();
    expect(after.beyondTierFee).toBe(99);

    // Restore original values so this test doesn't leak state into others.
    await adminCaller.settings.update({
      pickupInstructions: before.pickupInstructions ?? undefined,
      beyondTierFee: before.beyondTierFee,
    });
  });

  it("updates delivery tiers", async () => {
    const adminCaller = appRouter.createCaller(createAdminContext());
    const publicCaller = appRouter.createCaller(createPublicContext());

    const before = await publicCaller.settings.get();

    const newTiers = [{ maxKm: 3, fee: 12 }];
    const updated = await adminCaller.settings.update({ deliveryTiers: newTiers });

    expect(updated.deliveryTiers).toEqual(newTiers);

    // Restore original tiers.
    await adminCaller.settings.update({ deliveryTiers: before.deliveryTiers });
  });
});
