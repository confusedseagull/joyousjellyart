import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createOrder } from "./db";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    admin: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Order Confirmation Public Access", () => {
  let testOrderId: number;
  let testMixedOrderId: number;

  beforeAll(async () => {
    const order = await createOrder({
      customerName: "Test Customer 2",
      customerPhone: "+6587654321",
      deliveryMethod: "delivery",
      deliveryAddress: "123 Test Street",
      fulfillmentDate: new Date("2026-02-05"),
      items: [{
        collection: "custom",
        id: "test-item",
        format: "cake",
        theme: "birthday",
        shape: "round",
        size: "8inch",
        selectedColors: ["#FF0000", "#00FF00"],
        flavours: ["vanilla", "chocolate"],
        price: 118,
        quantity: 1,
      }],
      subtotal: 118,
      deliveryFee: 0,
      total: 118,
      status: "pending_confirmation",
    });
    testOrderId = order.id;

    const mixedOrder = await createOrder({
      customerName: "Mixed Cart Customer",
      customerPhone: "+6512345678",
      customerEmail: "test@example.com",
      deliveryMethod: "pickup",
      fulfillmentDate: new Date("2026-02-01"),
      items: [
        {
          collection: "cny",
          id: "test-cny-item",
          name: "Golden Gallop",
          edition: "Prosperity Edition",
          size: "8\"",
          flavor: "Jujube & Gojiberries",
          price: 128,
          quantity: 1,
          image: "/test.jpg",
        },
        {
          collection: "custom",
          id: "test-custom-item",
          format: "cake",
          theme: "birthday",
          shape: "round",
          size: "8inch",
          flavours: ["vanilla"],
          price: 118,
          quantity: 1,
        },
      ],
      subtotal: 246,
      deliveryFee: 0,
      total: 246,
      status: "pending_confirmation",
    });
    testMixedOrderId = mixedOrder.id;
  });

  it("should allow public access to getByIdForConfirmation", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const order = await caller.orders.getByIdForConfirmation({
      id: testOrderId,
    });

    expect(order).toBeDefined();
    expect(order.id).toBe(testOrderId);
    expect(order.customerName).toBe("Test Customer 2");
  });

  it("should allow public access to a mixed-collection order", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const order = await caller.orders.getByIdForConfirmation({
      id: testMixedOrderId,
    });

    expect(order).toBeDefined();
    expect(order.items).toHaveLength(2);
    expect(order.items[0].collection).toBe("cny");
    expect(order.items[1].collection).toBe("custom");
  });

  it("should throw NOT_FOUND for non-existent order", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.orders.getByIdForConfirmation({ id: 999999 })
    ).rejects.toThrow("Order not found");
  });
});
