import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createCnyOrder, createOrder } from "./db";

describe("Order Confirmation Public Access", () => {
  let testCnyOrderId: number;
  let testCustomOrderId: number;

  beforeAll(async () => {
    // Create test CNY order
    const cnyOrder = await createCnyOrder({
      customerName: "Test Customer",
      customerPhone: "+6512345678",
      customerEmail: "test@example.com",
      deliveryMethod: "pickup",
      fulfillmentDate: new Date("2026-02-01"),
      items: JSON.stringify([
        {
          name: "Golden Gallop",
          edition: "Prosperity Edition",
          size: "8\"",
          flavor: "Jujube & Gojiberries",
          price: 128,
          quantity: 1,
          image: "/test.jpg"
        }
      ]),
      subtotal: 128,
      deliveryFee: 0,
      total: 128,
      status: "pending_confirmation",
    });
    testCnyOrderId = cnyOrder.id;

    // Create test custom order
    const customOrder = await createOrder({
      customerName: "Test Customer 2",
      customerPhone: "+6587654321",
      deliveryMethod: "delivery",
      deliveryAddress: "123 Test Street",
      fulfillmentDate: new Date("2026-02-05"),
      shape: "round",
      theme: "birthday",
      primaryColor: "#FF0000",
      secondaryColors: ["#00FF00"],
      flavours: ["vanilla", "chocolate"],
      status: "pending_confirmation",
    });
    testCustomOrderId = customOrder.id;
  });

  describe("CNY Orders", () => {
    it("should allow public access to getByIdForConfirmation", async () => {
      const caller = appRouter.createCaller({
        user: null, // No authentication
        req: {} as any,
        res: {} as any,
      });

      const order = await caller.cnyOrders.getByIdForConfirmation({
        id: testCnyOrderId,
      });

      expect(order).toBeDefined();
      expect(order.id).toBe(testCnyOrderId);
      expect(order.customerName).toBe("Test Customer");
    });

    it("should throw NOT_FOUND for non-existent CNY order", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.cnyOrders.getByIdForConfirmation({ id: 999999 })
      ).rejects.toThrow("CNY order not found");
    });
  });

  describe("Custom Orders", () => {
    it("should allow public access to getByIdForConfirmation", async () => {
      const caller = appRouter.createCaller({
        user: null, // No authentication
        req: {} as any,
        res: {} as any,
      });

      const order = await caller.orders.getByIdForConfirmation({
        id: testCustomOrderId,
      });

      expect(order).toBeDefined();
      expect(order.id).toBe(testCustomOrderId);
      expect(order.customerName).toBe("Test Customer 2");
    });

    it("should throw NOT_FOUND for non-existent custom order", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.orders.getByIdForConfirmation({ id: 999999 })
      ).rejects.toThrow("Order not found");
    });
  });
});
