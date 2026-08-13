import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { businessSettings } from "../drizzle/schema";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

// Seeded on first read — mirrors the values that were previously hardcoded
// in Cart.tsx (PICKUP_ADDRESS) and deliveryCalculator.ts (SHOP_ADDRESS /
// distance tiers), so behavior doesn't change until an admin edits them.
const DEFAULT_SETTINGS = {
  pickupAddress: "2 Jalan Lokam, #01-27 Kensington Square, Singapore 537846",
  pickupInstructions: "Usually ready in 2-4 days",
  shopAddressForDistance: "2 Jalan Lokam, #01-27 Kensington Square, Singapore 537846",
  deliveryTiers: [
    { maxKm: 5, fee: 18 },
    { maxKm: 10, fee: 19 },
    { maxKm: 20, fee: 22 },
  ],
  beyondTierFee: 25,
};

export async function getOrCreateBusinessSettings() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const existing = await db.select().from(businessSettings).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(businessSettings).values(DEFAULT_SETTINGS);
  const [seeded] = await db.select().from(businessSettings).limit(1);
  return seeded;
}

const deliveryTierSchema = z.object({
  maxKm: z.number().positive(),
  fee: z.number().nonnegative(),
});

export const settingsRouter = router({
  // Public: pickup address/instructions are already shown to customers on
  // the checkout page, nothing sensitive here.
  get: publicProcedure.query(async () => {
    return await getOrCreateBusinessSettings();
  }),

  update: adminProcedure
    .input(
      z.object({
        pickupAddress: z.string().min(1).optional(),
        pickupInstructions: z.string().optional(),
        shopAddressForDistance: z.string().min(1).optional(),
        deliveryTiers: z.array(deliveryTierSchema).min(1).optional(),
        beyondTierFee: z.number().nonnegative().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const current = await getOrCreateBusinessSettings();
      await db.update(businessSettings).set(input).where(eq(businessSettings.id, current.id));
      return await getOrCreateBusinessSettings();
    }),
});
