import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("orders.create with Instagram references", () => {
  it("creates an order with Instagram references", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Test Customer",
      customerPhone: "+65 1234 5678",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2026-02-01T14:00:00Z"),
      shape: "round_large",
      theme: "floral_roses",
      primaryColor: "#84CECF",
      flavours: ["lychee"],
      instagramReferences: [
        {
          link: "https://www.instagram.com/p/example1/",
          description: "Love the color combination"
        },
        {
          link: "https://www.instagram.com/p/example2/",
          description: "Beautiful floral arrangement"
        }
      ]
    };

    const order = await caller.orders.create(orderData);

    expect(order).toBeDefined();
    expect(order.id).toBeTypeOf("number");
    expect(order.customerName).toBe("Test Customer");
    expect(order.instagramReferences).toEqual([
      {
        link: "https://www.instagram.com/p/example1/",
        description: "Love the color combination"
      },
      {
        link: "https://www.instagram.com/p/example2/",
        description: "Beautiful floral arrangement"
      }
    ]);

    // Clean up
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.id, order.id));
    }
  });

  it("creates an order without Instagram references", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Test Customer 2",
      customerPhone: "+65 8765 4321",
      deliveryMethod: "delivery" as const,
      deliveryAddress: "123 Test Street",
      fulfillmentDate: new Date("2026-02-15T10:00:00Z"),
      shape: "set_of_9",
      theme: "under_the_sea",
      primaryColor: "#00CEC9",
      flavours: ["lychee", "yuzu", "coconut"]
    };

    const order = await caller.orders.create(orderData);

    expect(order).toBeDefined();
    expect(order.id).toBeTypeOf("number");
    expect(order.customerName).toBe("Test Customer 2");
    expect(order.instagramReferences).toBeNull();

    // Clean up
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.id, order.id));
    }
  });

  it("creates an order with Instagram link but no description", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Test Customer 3",
      customerPhone: "+65 9999 8888",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2026-03-01T16:00:00Z"),
      shape: "square_large",
      theme: "koi_pond",
      primaryColor: "#FFA07A",
      flavours: ["osmanthus"],
      instagramReferences: [
        {
          link: "https://www.instagram.com/p/example3/"
        }
      ]
    };

    const order = await caller.orders.create(orderData);

    expect(order).toBeDefined();
    expect(order.instagramReferences).toEqual([
      {
        link: "https://www.instagram.com/p/example3/"
      }
    ]);

    // Clean up
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.id, order.id));
    }
  });
});

describe("orders.update with Instagram references", () => {
  let testOrderId: number;

  beforeAll(async () => {
    // Create a test order first
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const order = await caller.orders.create({
      customerName: "Update Test",
      customerPhone: "+65 1111 2222",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2026-04-01T12:00:00Z"),
      shape: "round_large",
      theme: "chess",
      primaryColor: "#2D3436",
      flavours: ["cheesecake"]
    });

    testOrderId = order.id;
  });

  it("updates an order to add Instagram references", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const updatedOrder = await caller.orders.update({
      id: testOrderId,
      instagramReferences: [
        {
          link: "https://www.instagram.com/p/updated1/",
          description: "Added reference"
        }
      ]
    });

    expect(updatedOrder).toBeDefined();
    expect(updatedOrder.instagramReferences).toEqual([
      {
        link: "https://www.instagram.com/p/updated1/",
        description: "Added reference"
      }
    ]);

    // Clean up
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.id, testOrderId));
    }
  });
});
