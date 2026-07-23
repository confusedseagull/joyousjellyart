import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@joyousjelly.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("orders.create", () => {
  it("allows public users to create orders", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "John Doe",
      customerPhone: "+65 1234 5678",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-02-01T14:00:00"),
      shape: "round_large",
      theme: "floral_roses",
      primaryColor: "#84CECF",
      secondaryColors: ["#FF6B9D", "#C44569"],
      cakeTextLanguage: "english" as const,
      cakeText: "Happy Birthday",
      flavours: ["lychee"],
    };

    const result = await caller.orders.create(orderData);

    expect(result).toBeDefined();
    expect(result.customerName).toBe("John Doe");
    expect(result.shape).toBe("round_large");
    expect(result.status).toBe("pending_confirmation");
  });

  it("creates order with delivery address when delivery method is selected", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Jane Smith",
      customerPhone: "+65 9876 5432",
      deliveryMethod: "delivery" as const,
      deliveryAddress: "123 Main Street, Singapore 123456",
      fulfillmentDate: new Date("2025-02-15T16:00:00"),
      shape: "set_of_9",
      theme: "under_the_sea",
      primaryColor: "#00CEC9",
      flavours: ["coconut", "yuzu", "osmanthus"],
    };

    const result = await caller.orders.create(orderData);

    expect(result).toBeDefined();
    expect(result.deliveryMethod).toBe("delivery");
    expect(result.deliveryAddress).toBe("123 Main Street, Singapore 123456");
    expect(result.flavours).toHaveLength(3);
  });

  it("creates order with cartoon character when cartoon theme is selected", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const orderData = {
      customerName: "Alice Wong",
      customerPhone: "+65 8888 8888",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-03-01T10:00:00"),
      shape: "square_large",
      theme: "cartoon",
      cartoonCharacter: "Pikachu",
      primaryColor: "#FFD700",
      flavours: ["cheesecake"],
    };

    const result = await caller.orders.create(orderData);

    expect(result).toBeDefined();
    expect(result.theme).toBe("cartoon");
    expect(result.cartoonCharacter).toBe("Pikachu");
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

    // First create an order
    const publicCaller = appRouter.createCaller(createPublicContext());
    const order = await publicCaller.orders.create({
      customerName: "Test User",
      customerPhone: "+65 1111 1111",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-04-01T12:00:00"),
      shape: "round_large",
      theme: "space",
      primaryColor: "#6C5CE7",
      flavours: ["longan"],
    });

    // Then update its status
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

    // First create an order
    const publicCaller = appRouter.createCaller(createPublicContext());
    const order = await publicCaller.orders.create({
      customerName: "Original Name",
      customerPhone: "+65 2222 2222",
      deliveryMethod: "pickup" as const,
      fulfillmentDate: new Date("2025-05-01T15:00:00"),
      shape: "numbers_large",
      theme: "chess",
      primaryColor: "#000000",
      flavours: ["lychee"],
    });

    // Then update customer details
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
