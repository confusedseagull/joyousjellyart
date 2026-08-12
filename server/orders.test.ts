import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { resetRateLimits } from "./_core/rateLimit";

// orders.create is rate-limited per IP; the test context has no real IP, so
// every call in this file shares one bucket. Reset it before each test so
// the suite's pass/fail doesn't depend on how many calls preceded it.
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
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    admin: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function makeItem(overrides: Partial<{
  id: string;
  format: "cake" | "jellyPlatter" | "miniGiftBox";
  theme: string;
  shape: string;
  size: string;
  flavours: string[];
  cartoonCharacter: string;
  selectedColors: string[];
  price: number;
  quantity: number;
}> = {}) {
  return {
    collection: "custom" as const,
    id: "item-1",
    format: "cake" as const,
    theme: "space",
    shape: "round",
    size: "8inch",
    flavours: ["lychee"],
    price: 118,
    quantity: 1,
    ...overrides,
  };
}

function makeCnyItem(overrides: Partial<{
  id: string;
  name: string;
  edition: string;
  size: string;
  flavor: string;
  price: number;
  quantity: number;
  image: string;
}> = {}) {
  return {
    collection: "cny" as const,
    id: "golden-gallop-8-longan",
    name: "Golden Gallop",
    edition: "2026 CNY Collection",
    size: "8 inch",
    flavor: "Longan",
    price: 128,
    quantity: 1,
    image: "/images/golden-gallop.jpg",
    ...overrides,
  };
}

describe("orders.create", () => {
  it("allows public users to create orders", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "John Doe",
      customerEmail: "john.doe@example.com",
      customerPhone: "+65 1234 5678",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-02-01T14:00:00"),
      items: [makeItem({ theme: "floralBouquet", shape: "round", size: "8inch", selectedColors: ["#84CECF", "#FF6B9D"], flavours: ["lychee"] })],
      subtotal: 118,
      deliveryFee: 0,
      total: 118,
    };

    const result = await caller.orders.create(orderData);

    expect(result).toBeDefined();
    expect(result.customerName).toBe("John Doe");
    expect(result.items[0].shape).toBe("round");
    expect(result.status).toBe("pending_confirmation");
  });

  it("creates order with delivery address when delivery method is selected", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Jane Smith",
      customerEmail: "jane.smith@example.com",
      customerPhone: "+65 9876 5432",
      deliveryMethod: "delivery" as const,
      deliveryAddress: "123 Main Street, Singapore 123456",
      fulfillmentDate: new Date("2025-02-15T16:00:00"),
      items: [makeItem({
        format: "jellyPlatter",
        theme: "underTheSea",
        shape: "platter9",
        size: "6cm",
        selectedColors: ["#00CEC9"],
        flavours: ["coconut", "yuzu"],
        price: 108,
      })],
      subtotal: 108,
      deliveryFee: 10,
      total: 118,
    };

    const result = await caller.orders.create(orderData);

    expect(result).toBeDefined();
    expect(result.deliveryMethod).toBe("delivery");
    expect(result.deliveryAddress).toBe("123 Main Street, Singapore 123456");
    expect(result.items[0].flavours).toHaveLength(2);
  });

  it("creates order with cartoon character when cartoon theme is selected", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Alice Wong",
      customerEmail: "alice.wong@example.com",
      customerPhone: "+65 8888 8888",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-03-01T10:00:00"),
      items: [makeItem({
        theme: "cartoonCharacters",
        shape: "square",
        size: "8inch",
        cartoonCharacter: "Pikachu",
        flavours: ["cheesecake"],
      })],
      subtotal: 118,
      deliveryFee: 0,
      total: 118,
    };

    const result = await caller.orders.create(orderData);

    expect(result).toBeDefined();
    expect(result.items[0].theme).toBe("cartoonCharacters");
    expect(result.items[0].cartoonCharacter).toBe("Pikachu");
  });

  it("supports multiple cake items in a single order", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Multi Item",
      customerEmail: "multi.item@example.com",
      customerPhone: "+65 7777 7777",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-03-05T10:00:00"),
      items: [
        makeItem({ id: "item-1", theme: "space", shape: "round", size: "8inch", price: 118 }),
        makeItem({ id: "item-2", format: "miniGiftBox", theme: "space", shape: "miniGiftBox", size: "10cm", price: 18.9, quantity: 3 }),
      ],
      subtotal: 174.7,
      deliveryFee: 0,
      total: 174.7,
    };

    const result = await caller.orders.create(orderData);

    expect(result.items).toHaveLength(2);
    expect(result.items[1].quantity).toBe(3);
  });

  it("allows a cny-collection item", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Cny Customer",
      customerEmail: "cny.customer@example.com",
      customerPhone: "+65 4444 4444",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-06-01T10:00:00"),
      items: [makeCnyItem()],
      subtotal: 128,
      deliveryFee: 0,
      total: 128,
    };

    const result = await caller.orders.create(orderData);

    expect(result).toBeDefined();
    expect(result.items[0].collection).toBe("cny");
    expect((result.items[0] as any).name).toBe("Golden Gallop");
  });

  it("supports a mixed order with both a custom item and a cny item", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Mixed Cart Customer",
      customerEmail: "mixed.cart@example.com",
      customerPhone: "+65 5555 5555",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-06-15T10:00:00"),
      items: [
        makeItem({ id: "item-custom", theme: "space", shape: "round", size: "8inch", price: 118 }),
        makeCnyItem({ id: "item-cny", price: 128 }),
      ],
      subtotal: 246,
      deliveryFee: 0,
      total: 246,
    };

    const result = await caller.orders.create(orderData);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].collection).toBe("custom");
    expect(result.items[1].collection).toBe("cny");
  });
});

describe("orders.list", () => {
  it("requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orders.list()).rejects.toThrow("Please login");
  });

  it("allows admin users to list orders", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orders.list();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("orders.updateStatus", () => {
  it("requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.updateStatus({ id: 1, status: "completed" })
    ).rejects.toThrow("Please login");
  });

  it("allows admin to update order status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const publicCaller = appRouter.createCaller(createPublicContext());
    const order = await publicCaller.orders.create({
      customerName: "Test User",
      customerEmail: "test.user@example.com",
      customerPhone: "+65 1111 1111",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-04-01T12:00:00"),
      items: [makeItem({ theme: "space", shape: "round", size: "8inch" })],
      subtotal: 118,
      deliveryFee: 0,
      total: 118,
    });

    const updated = await caller.orders.updateStatus({
      id: order.id,
      status: "in_progress",
    });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe("in_progress");
  });
});

describe("orders.update", () => {
  it("requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orders.update({ id: 1, customerName: "Updated Name" })
    ).rejects.toThrow("Please login");
  });

  it("allows admin to update order details", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const publicCaller = appRouter.createCaller(createPublicContext());
    const order = await publicCaller.orders.create({
      customerName: "Original Name",
      customerEmail: "original.name@example.com",
      customerPhone: "+65 2222 2222",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-05-01T15:00:00"),
      items: [makeItem({ theme: "chess", shape: "numbers", size: "8x8" })],
      subtotal: 118,
      deliveryFee: 0,
      total: 118,
    });

    const updated = await caller.orders.update({
      id: order.id,
      customerName: "Updated Name",
      customerPhone: "+65 3333 3333",
    });

    expect(updated).toBeDefined();
    expect(updated?.customerName).toBe("Updated Name");
    expect(updated?.customerPhone).toBe("+65 3333 3333");
  });
});
