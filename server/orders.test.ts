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

describe("orders.listByBucket", () => {
  it("requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orders.listByBucket({ bucket: "today" })).rejects.toThrow("Please login");
  });

  it("buckets orders by fulfillment date", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());

    const now = new Date();
    const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const tomorrowNoon = new Date(todayNoon.getTime() + 24 * 60 * 60 * 1000);
    const yesterdayNoon = new Date(todayNoon.getTime() - 24 * 60 * 60 * 1000);

    const todayOrder = await publicCaller.orders.create({
      customerName: "Bucket Today", customerEmail: "bucket.today@example.com", customerPhone: "+65 1000 0001",
      deliveryMethod: "pickup", fulfillmentDate: todayNoon,
      items: [makeItem({ id: "bucket-today-item" })], subtotal: 118, deliveryFee: 0, total: 118,
    });
    const tomorrowOrder = await publicCaller.orders.create({
      customerName: "Bucket Tomorrow", customerEmail: "bucket.tomorrow@example.com", customerPhone: "+65 1000 0002",
      deliveryMethod: "pickup", fulfillmentDate: tomorrowNoon,
      items: [makeItem({ id: "bucket-tomorrow-item" })], subtotal: 118, deliveryFee: 0, total: 118,
    });
    const pastOrder = await publicCaller.orders.create({
      customerName: "Bucket Past", customerEmail: "bucket.past@example.com", customerPhone: "+65 1000 0003",
      deliveryMethod: "pickup", fulfillmentDate: yesterdayNoon,
      items: [makeItem({ id: "bucket-past-item" })], subtotal: 118, deliveryFee: 0, total: 118,
    });

    const todayResult = await adminCaller.orders.listByBucket({ bucket: "today" });
    expect(todayResult.items.some((o) => o.id === todayOrder.id)).toBe(true);
    expect(todayResult.items.some((o) => o.id === tomorrowOrder.id)).toBe(false);
    expect(todayResult.items.some((o) => o.id === pastOrder.id)).toBe(false);

    const upcomingResult = await adminCaller.orders.listByBucket({ bucket: "upcoming" });
    expect(upcomingResult.items.some((o) => o.id === tomorrowOrder.id)).toBe(true);
    expect(upcomingResult.items.some((o) => o.id === todayOrder.id)).toBe(false);

    const pastResult = await adminCaller.orders.listByBucket({ bucket: "past" });
    expect(pastResult.items.some((o) => o.id === pastOrder.id)).toBe(true);
    expect(pastResult.items.some((o) => o.id === todayOrder.id)).toBe(false);
  });

  it("filters by search term", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());

    const uniqueName = `SearchTarget${Date.now()}`;
    const order = await publicCaller.orders.create({
      customerName: uniqueName, customerEmail: "search.target@example.com", customerPhone: "+65 1000 0004",
      deliveryMethod: "pickup", fulfillmentDate: new Date(),
      items: [makeItem({ id: "search-item" })], subtotal: 118, deliveryFee: 0, total: 118,
    });

    const result = await adminCaller.orders.listByBucket({ bucket: "today", search: uniqueName });
    expect(result.items.some((o) => o.id === order.id)).toBe(true);

    const noMatch = await adminCaller.orders.listByBucket({ bucket: "today", search: "NoSuchCustomerXYZ" });
    expect(noMatch.items.some((o) => o.id === order.id)).toBe(false);
  });

  it("filters by collection", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());

    const order = await publicCaller.orders.create({
      customerName: "Collection Filter Test", customerEmail: "collection.filter@example.com", customerPhone: "+65 1000 0005",
      deliveryMethod: "pickup", fulfillmentDate: new Date(),
      items: [makeCnyItem({ id: "collection-filter-item" })], subtotal: 128, deliveryFee: 0, total: 128,
    });

    const cnyResult = await adminCaller.orders.listByBucket({ bucket: "today", collection: "cny" });
    expect(cnyResult.items.some((o) => o.id === order.id)).toBe(true);

    const customResult = await adminCaller.orders.listByBucket({ bucket: "today", collection: "custom" });
    expect(customResult.items.some((o) => o.id === order.id)).toBe(false);
  });

  it("paginates the past bucket", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await publicCaller.orders.create({
      customerName: "Pagination A", customerEmail: "pagination.a@example.com", customerPhone: "+65 1000 0006",
      deliveryMethod: "pickup", fulfillmentDate: yesterday,
      items: [makeItem({ id: "pagination-a-item" })], subtotal: 118, deliveryFee: 0, total: 118,
    });
    await publicCaller.orders.create({
      customerName: "Pagination B", customerEmail: "pagination.b@example.com", customerPhone: "+65 1000 0007",
      deliveryMethod: "pickup", fulfillmentDate: yesterday,
      items: [makeItem({ id: "pagination-b-item" })], subtotal: 118, deliveryFee: 0, total: 118,
    });

    const page = await adminCaller.orders.listByBucket({ bucket: "past", limit: 1, offset: 0 });
    expect(page.items).toHaveLength(1);
    expect(page.hasMore).toBe(true);
  });
});

describe("orders.getDashboardStats", () => {
  it("requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orders.getDashboardStats()).rejects.toThrow("Please login");
  });

  it("counts new orders created today and upcoming orders due today", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());

    const before = await adminCaller.orders.getDashboardStats();

    const now = new Date();
    const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    await publicCaller.orders.create({
      customerName: "Stats Today", customerEmail: "stats.today@example.com", customerPhone: "+65 1000 0008",
      deliveryMethod: "pickup", fulfillmentDate: todayNoon,
      items: [makeItem({ id: "stats-today-item" })], subtotal: 118, deliveryFee: 0, total: 118,
    });

    const after = await adminCaller.orders.getDashboardStats();

    expect(after.newOrdersToday).toBe(before.newOrdersToday + 1);
    expect(after.upcomingToday).toBe(before.upcomingToday + 1);
  });
});

describe("orders.getOrdersForDay", () => {
  it("requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orders.getOrdersForDay({ day: "today" })).rejects.toThrow("Please login");
  });

  it("returns orders scheduled for tomorrow, not today", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());

    const tomorrowNoon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrowNoon.setHours(12, 0, 0, 0);

    const order = await publicCaller.orders.create({
      customerName: "Day Query Tomorrow", customerEmail: "day.tomorrow@example.com", customerPhone: "+65 1000 0009",
      deliveryMethod: "delivery", deliveryAddress: "1 Test Street, Singapore 000001",
      fulfillmentDate: tomorrowNoon, timeRange: "1:00 PM - 3:00 PM",
      items: [makeItem({ id: "day-query-item" })], subtotal: 118, deliveryFee: 10, total: 128,
    });

    const tomorrowResult = await adminCaller.orders.getOrdersForDay({ day: "tomorrow" });
    expect(tomorrowResult.some((o) => o.id === order.id)).toBe(true);

    const todayResult = await adminCaller.orders.getOrdersForDay({ day: "today" });
    expect(todayResult.some((o) => o.id === order.id)).toBe(false);
  });
});

describe("orders.getRevenueTrend", () => {
  it("requires admin authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orders.getRevenueTrend({})).rejects.toThrow("Please login");
  });

  it("includes revenue from a newly-paid order in the trend total", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const adminCaller = appRouter.createCaller(createAdminContext());

    const before = await adminCaller.orders.getRevenueTrend({ days: 7 });
    const totalBefore = before.reduce((sum, p) => sum + p.revenue, 0);

    const order = await publicCaller.orders.create({
      customerName: "Revenue Trend Test", customerEmail: "revenue.trend@example.com", customerPhone: "+65 1000 0010",
      deliveryMethod: "pickup", fulfillmentDate: new Date(),
      items: [makeItem({ id: "revenue-item", price: 118 })], subtotal: 118, deliveryFee: 0, total: 118,
    });
    await adminCaller.orders.update({ id: order.id, paymentStatus: "paid" });

    const after = await adminCaller.orders.getRevenueTrend({ days: 7 });
    const totalAfter = after.reduce((sum, p) => sum + p.revenue, 0);

    expect(totalAfter).toBeGreaterThanOrEqual(totalBefore + 118);
  });
});
